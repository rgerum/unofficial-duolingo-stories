import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getSessionLegacyUserId } from "./lib/authorization";

const storyDoneInputValidator = v.object({
  legacyStoryId: v.number(),
  time: v.optional(v.number()),
});

const dashboardCourseValidator = v.object({
  short: v.string(),
  name: v.string(),
  learningLanguageName: v.string(),
  learningLanguageShort: v.string(),
  learningLanguageFlag: v.optional(v.union(v.number(), v.string())),
  learningLanguageFlagFile: v.optional(v.string()),
});

const nextStepValidator = v.object({
  course: dashboardCourseValidator,
  completedCount: v.number(),
  totalCount: v.number(),
  nextStoryId: v.union(v.number(), v.null()),
  reviewStoryId: v.union(v.number(), v.null()),
});

export const recordStoryDone = mutation({
  args: storyDoneInputValidator.fields,
  returns: v.object({
    inserted: v.boolean(),
    docId: v.id("story_done"),
  }),
  handler: async (ctx, args) => {
    const legacyUserId = await getSessionLegacyUserId(ctx);

    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyStoryId))
      .unique();
    if (!story) {
      throw new Error(`Missing story for legacy id ${args.legacyStoryId}`);
    }

    const doneAt = args.time ?? Date.now();
    const docId = await ctx.db.insert("story_done", {
      storyId: story._id,
      legacyUserId: legacyUserId ?? undefined,
      time: doneAt,
    });

    if (typeof legacyUserId === "number") {
      const course = await ctx.db.get(story.courseId);
      if (
        course &&
        typeof course.legacyId === "number" &&
        typeof story.legacyId === "number"
      ) {
        await upsertStoryDoneState(ctx, {
          legacyUserId,
          storyId: story._id,
          courseId: story.courseId,
          legacyStoryId: story.legacyId,
          legacyCourseId: course.legacyId,
          lastDoneAt: doneAt,
        });
        await upsertCourseActivity(ctx, {
          legacyUserId,
          courseId: story.courseId,
          legacyCourseId: course.legacyId,
          lastDoneAt: doneAt,
        });
      }
    }

    return { inserted: true, docId };
  },
});

export const getDoneStoryIdsForCourse = query({
  args: {
    legacyCourseId: v.number(),
    legacyUserId: v.number(),
  },
  returns: v.array(v.number()),
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_id_value", (q) => q.eq("legacyId", args.legacyCourseId))
      .unique();
    if (!course) return [];

    return await getDoneStoryIdsForCourseIdAndUser(
      ctx,
      course._id,
      args.legacyUserId,
    );
  },
});

export const getDoneStoryIdsForCurrentUserInCourse = query({
  args: {
    courseShort: v.string(),
  },
  returns: v.array(v.number()),
  handler: async (ctx, args) => {
    const legacyUserId = await getSessionLegacyUserId(ctx);
    if (!legacyUserId) return [];

    const course = await ctx.db
      .query("courses")
      .withIndex("by_short", (q) => q.eq("short", args.courseShort))
      .unique();
    if (!course) return [];

    return await getDoneStoryIdsForCourseIdAndUser(
      ctx,
      course._id,
      legacyUserId,
    );
  },
});

async function getDoneStoryIdsForCourseIdAndUser(
  ctx: QueryCtx,
  courseId: Id<"courses">,
  legacyUserId: number,
) {
  const doneStateRows = await ctx.db
    .query("story_done_state")
    .withIndex("by_user_and_course", (q) =>
      q.eq("legacyUserId", legacyUserId).eq("courseId", courseId),
    )
    .collect();
  if (doneStateRows.length > 0) {
    const storyIds = new Set<number>();
    for (const row of doneStateRows) {
      storyIds.add(row.legacyStoryId);
    }
    return Array.from(storyIds.values());
  }
  return [];
}

export const getDoneCourseIdsForUser = query({
  args: {},
  returns: v.union(v.array(v.number()), v.null()),
  handler: async (ctx) => {
    const legacyUserId = await getCurrentIdentityLegacyUserId(ctx);
    if (!legacyUserId) return null;

    const activityRows = await ctx.db
      .query("course_activity")
      .withIndex("by_user_and_last_done_at", (q) =>
        q.eq("legacyUserId", legacyUserId),
      )
      .order("desc")
      .collect();
    const uniqueCourseIds = new Set<number>();
    const result: Array<number> = [];
    for (const row of activityRows) {
      if (uniqueCourseIds.has(row.legacyCourseId)) continue;
      uniqueCourseIds.add(row.legacyCourseId);
      result.push(row.legacyCourseId);
    }
    return result;
  },
});

export const getLastDoneCourseShortForLegacyUser = query({
  args: {
    legacyUserId: v.number(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const activityRows = await ctx.db
      .query("course_activity")
      .withIndex("by_user_and_last_done_at", (q) =>
        q.eq("legacyUserId", args.legacyUserId),
      )
      .order("desc")
      .take(20);

    for (const row of activityRows) {
      const course = await ctx.db.get(row.courseId);
      if (!course?.short) continue;
      return course.short;
    }
    return null;
  },
});

export const getNextStoryForCurrentUserInCourse = query({
  args: {
    courseShort: v.string(),
    currentStoryId: v.optional(v.number()),
  },
  returns: v.union(nextStepValidator, v.null()),
  handler: async (ctx, args) => {
    const legacyUserId = await getCurrentIdentityLegacyUserId(ctx);
    if (!legacyUserId) return null;

    const course = await ctx.db
      .query("courses")
      .withIndex("by_short", (q) => q.eq("short", args.courseShort))
      .unique();
    if (!course) return null;

    return await getNextStepForCourse(ctx, {
      courseId: course._id,
      legacyUserId,
      currentStoryId: args.currentStoryId,
    });
  },
});

async function upsertStoryDoneState(
  ctx: MutationCtx,
  args: {
    storyId: Id<"stories">;
    courseId: Id<"courses">;
    legacyStoryId: number;
    legacyCourseId: number;
    legacyUserId: number;
    lastDoneAt: number;
  },
) {
  const existingRows = await ctx.db
    .query("story_done_state")
    .withIndex("by_user_and_story", (q) =>
      q.eq("legacyUserId", args.legacyUserId).eq("storyId", args.storyId),
    )
    .collect();
  if (existingRows.length === 0) {
    await ctx.db.insert("story_done_state", args);
    return;
  }

  for (const row of existingRows) {
    await ctx.db.patch(row._id, {
      courseId: args.courseId,
      legacyStoryId: args.legacyStoryId,
      legacyCourseId: args.legacyCourseId,
      lastDoneAt: Math.max(row.lastDoneAt, args.lastDoneAt),
    });
  }
}

async function getNextStepForCourse(
  ctx: QueryCtx,
  args: {
    courseId: Id<"courses">;
    legacyUserId: number;
    currentStoryId?: number;
  },
) {
  const course = await ctx.db.get(args.courseId);
  if (!course?.public || !course.short) return null;

  const learningLanguage = await ctx.db.get(course.learningLanguageId);
  if (!learningLanguage) return null;

  const publicStories = await ctx.db
    .query("stories")
    .withIndex("by_course_public_deleted_set", (q) =>
      q.eq("courseId", args.courseId).eq("public", true).eq("deleted", false),
    )
    .collect();

  const orderedStories = publicStories
    .filter(
      (story): story is typeof story & { legacyId: number } =>
        typeof story.legacyId === "number",
    )
    .sort((a, b) => {
      const setCmp = (a.set_id ?? 0) - (b.set_id ?? 0);
      if (setCmp !== 0) return setCmp;
      return (a.set_index ?? 0) - (b.set_index ?? 0);
    });
  if (orderedStories.length === 0) return null;

  const doneStoryIds = new Set<number>(
    await getDoneStoryIdsForCourseIdAndUser(
      ctx,
      args.courseId,
      args.legacyUserId,
    ),
  );
  if (typeof args.currentStoryId === "number") {
    doneStoryIds.add(args.currentStoryId);
  }

  const totalCount = orderedStories.length;
  const completedCount = orderedStories.reduce(
    (count, story) => count + (doneStoryIds.has(story.legacyId) ? 1 : 0),
    0,
  );

  const currentIndex =
    typeof args.currentStoryId === "number"
      ? orderedStories.findIndex(
          (story) => story.legacyId === args.currentStoryId,
        )
      : -1;

  let nextStory =
    currentIndex >= 0
      ? orderedStories
          .slice(currentIndex + 1)
          .find((story) => !doneStoryIds.has(story.legacyId))
      : undefined;
  if (!nextStory) {
    nextStory = orderedStories.find(
      (story) => !doneStoryIds.has(story.legacyId),
    );
  }

  return {
    course: {
      short: course.short,
      name:
        course.name && course.name.trim().length > 0
          ? course.name
          : learningLanguage.name,
      learningLanguageName: learningLanguage.name,
      learningLanguageShort: learningLanguage.short,
      learningLanguageFlag: learningLanguage.flag,
      learningLanguageFlagFile: learningLanguage.flag_file,
    },
    completedCount,
    totalCount,
    nextStoryId: nextStory?.legacyId ?? null,
    reviewStoryId: orderedStories[0]?.legacyId ?? null,
  };
}

async function upsertCourseActivity(
  ctx: MutationCtx,
  args: {
    courseId: Id<"courses">;
    legacyCourseId: number;
    legacyUserId: number;
    lastDoneAt: number;
  },
) {
  const existingRows = await ctx.db
    .query("course_activity")
    .withIndex("by_user_and_course", (q) =>
      q.eq("legacyUserId", args.legacyUserId).eq("courseId", args.courseId),
    )
    .collect();
  if (existingRows.length === 0) {
    await ctx.db.insert("course_activity", args);
    return;
  }

  for (const row of existingRows) {
    await ctx.db.patch(row._id, {
      legacyCourseId: args.legacyCourseId,
      lastDoneAt: Math.max(row.lastDoneAt, args.lastDoneAt),
    });
  }
}

async function getCurrentIdentityLegacyUserId(
  ctx: QueryCtx,
): Promise<number | null> {
  const identity = (await ctx.auth.getUserIdentity()) as {
    userId?: string | number | null;
  } | null;
  const rawLegacyUserId = identity?.userId;
  if (typeof rawLegacyUserId === "number" && Number.isFinite(rawLegacyUserId)) {
    return rawLegacyUserId;
  }
  if (
    typeof rawLegacyUserId === "string" &&
    Number.isFinite(Number(rawLegacyUserId))
  ) {
    return Number(rawLegacyUserId);
  }
  return null;
}
