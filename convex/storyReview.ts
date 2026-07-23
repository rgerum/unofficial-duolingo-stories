import { v } from "convex/values";
import { internal } from "./_generated/api";
import { httpAction, internalQuery } from "./_generated/server";
import { buildAvatarRows } from "./lib/avatarRows";

// Data + HTTP entrypoint for the Discord review bot. The bot posts story ids
// with a shared secret; the actual lint runs in the node action in
// storyReviewLint.ts (it needs the story parser, which only bundles in the
// Node runtime).

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const getStoryReviewData = internalQuery({
  args: { storyId: v.number() },
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyId))
      .unique();
    if (!story || story.deleted || typeof story.legacyId !== "number") {
      return null;
    }
    const content = await ctx.db
      .query("story_content")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .unique();
    if (!content) return null;
    const course = await ctx.db.get(story.courseId);
    if (!course) return null;
    const [learningLanguage, fromLanguage] = await Promise.all([
      ctx.db.get(course.learningLanguageId),
      ctx.db.get(course.fromLanguageId),
    ]);
    if (!learningLanguage) return null;

    return {
      id: story.legacyId,
      name: story.name,
      status: story.status,
      approvalCount: story.approvalCount ?? 0,
      setId: story.set_id ?? 0,
      setIndex: story.set_index ?? 0,
      text: content.text,
      courseShort:
        course.short ??
        `${learningLanguage.short}-${fromLanguage?.short ?? ""}`,
      courseTags: course.tags ?? [],
      learningLanguageShort: learningLanguage.short,
      learningLanguageLegacyId: learningLanguage.legacyId,
      fromLanguageShort: fromLanguage?.short ?? "",
    };
  },
});

// Avatars are fetched separately (and cached per language by the node action)
// so a batch of same-course stories does not re-scan the avatars table per
// story.
export const getAvatarRowsByLanguageLegacyId = internalQuery({
  args: { languageLegacyId: v.number() },
  handler: async (ctx, args) => {
    const language = await ctx.db
      .query("languages")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.languageLegacyId))
      .unique();
    if (!language) return [];
    return await buildAvatarRows(ctx, language);
  },
});

// Compact course list for the bot's intent classifier prompt.
export const getCourseListForReview = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [courses, languages] = await Promise.all([
      ctx.db.query("courses").take(1000),
      ctx.db.query("languages").take(1000),
    ]);
    const languageById = new Map(
      languages.map((language) => [language._id, language]),
    );
    return courses
      .filter((course) => course.short)
      .map((course) => ({
        short: course.short as string,
        name: `${
          languageById.get(course.learningLanguageId)?.name ??
          course.learning_language_name ??
          ""
        } from ${
          languageById.get(course.fromLanguageId)?.name ??
          course.from_language_name ??
          ""
        }`,
      }));
  },
});

const MAX_SETS_PER_REQUEST = 8;

// Resolves "course + set numbers" (how contributors actually ask for reviews)
// to story ids, in set order. An empty sets array means "all sets".
export const getStoriesBySets = internalQuery({
  args: { courseShort: v.string(), sets: v.array(v.number()) },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_short", (q) => q.eq("short", args.courseShort))
      .unique();
    if (!course) return null;

    let setIds = [...new Set(args.sets)];
    if (setIds.length === 0) {
      const allStories = await ctx.db
        .query("stories")
        .withIndex("by_set", (q) => q.eq("courseId", course._id))
        .take(1000);
      setIds = [
        ...new Set(
          allStories
            .filter((story) => !story.deleted)
            .map((story) => story.set_id ?? 0),
        ),
      ].sort((a, b) => a - b);
    }
    setIds = setIds.slice(0, MAX_SETS_PER_REQUEST);

    const sets: { setId: number; storyIds: number[] }[] = [];
    for (const setId of setIds) {
      const stories = await ctx.db
        .query("stories")
        .withIndex("by_set", (q) =>
          q.eq("courseId", course._id).eq("set_id", setId),
        )
        .take(50);
      sets.push({
        setId,
        storyIds: stories
          .filter(
            (story) => !story.deleted && typeof story.legacyId === "number",
          )
          .sort((a, b) => (a.set_index ?? 0) - (b.set_index ?? 0))
          .map((story) => story.legacyId as number),
      });
    }
    return { courseShort: args.courseShort, sets };
  },
});

const MAX_STORIES_PER_REQUEST = 30;

export const reviewStoriesForDiscord = httpAction(async (ctx, req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  const expectedSecret = process.env.DISCORD_REVIEW_SECRET;
  if (!expectedSecret) {
    return json(
      { ok: false, error: "Missing DISCORD_REVIEW_SECRET env var" },
      500,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }
  const parsed = body as {
    secret?: unknown;
    storyIds?: unknown;
    courseShort?: unknown;
    sets?: unknown;
    listCourses?: unknown;
  };
  if (parsed.secret !== expectedSecret) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  try {
    if (parsed.listCourses === true) {
      const courses = await ctx.runQuery(
        internal.storyReview.getCourseListForReview,
        {},
      );
      return json({ ok: true, courses });
    }

    let storyIds: number[];
    if (typeof parsed.courseShort === "string") {
      const sets = Array.isArray(parsed.sets)
        ? parsed.sets.filter(
            (setId): setId is number =>
              typeof setId === "number" && Number.isInteger(setId),
          )
        : [];
      const resolution = await ctx.runQuery(
        internal.storyReview.getStoriesBySets,
        { courseShort: parsed.courseShort, sets },
      );
      if (!resolution) {
        return json({ ok: true, unknownCourse: true, stories: [] });
      }
      storyIds = resolution.sets.flatMap((set) => set.storyIds);
    } else {
      if (
        !Array.isArray(parsed.storyIds) ||
        parsed.storyIds.length === 0 ||
        !parsed.storyIds.every(
          (id) => typeof id === "number" && Number.isInteger(id) && id > 0,
        )
      ) {
        return json(
          {
            ok: false,
            error:
              "Provide storyIds (non-empty integer array), courseShort+sets, or listCourses",
          },
          400,
        );
      }
      storyIds = parsed.storyIds as number[];
    }

    storyIds = [...new Set(storyIds)].slice(0, MAX_STORIES_PER_REQUEST);
    if (storyIds.length === 0) {
      return json({ ok: true, stories: [] });
    }
    const stories = await ctx.runAction(
      internal.storyReviewLint.lintStoriesForReview,
      { storyIds },
    );
    return json({ ok: true, stories });
  } catch (error) {
    console.error("review-stories failed", error);
    return json({ ok: false, error: "Internal error" }, 500);
  }
});
