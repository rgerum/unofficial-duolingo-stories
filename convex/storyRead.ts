import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getPublicStoryJson } from "./lib/publicStoryContent";

// Avatars are reused for different characters across stories, so a mapping can
// carry per-story names keyed by duo_id (canonical `name` is the fallback that
// is already baked into the published JSON). Resolving at read time means one
// entry covers the canonical course and every translated copy sharing the
// duo_id, without republishing stories.
async function applyStoryCharacterNames(
  ctx: QueryCtx,
  elements: any[],
  duoId: string | undefined,
  learningLanguageId: Id<"languages">,
): Promise<any[]> {
  if (!duoId) return elements;
  const mappings = await ctx.db
    .query("avatar_mappings")
    .withIndex("by_language_id", (q) => q.eq("languageId", learningLanguageId))
    .collect();
  const withEntry = mappings.filter(
    (mapping) => mapping.storyNames?.[duoId] !== undefined,
  );
  if (withEntry.length === 0) return elements;

  const nameByCharacterId = new Map<number, string>();
  await Promise.all(
    withEntry.map(async (mapping) => {
      const avatar = await ctx.db.get(mapping.avatarId);
      const name = mapping.storyNames?.[duoId];
      if (avatar && name !== undefined) {
        nameByCharacterId.set(avatar.legacyId, name);
      }
    }),
  );

  return elements.map((element) => {
    if (typeof element !== "object" || element === null) return element;
    const line = (element as { line?: { characterId?: unknown } }).line;
    if (typeof line?.characterId !== "number") return element;
    const name = nameByCharacterId.get(line.characterId);
    if (name === undefined) return element;
    return { ...element, line: { ...line, characterName: name } };
  });
}

const storyReadResultValidator = v.union(
  v.object({
    id: v.number(),
    set_id: v.number(),
    course_id: v.number(),
    from_language: v.string(),
    from_language_id: v.number(),
    from_language_long: v.string(),
    from_language_rtl: v.boolean(),
    from_language_name: v.string(),
    learning_language: v.string(),
    learning_language_long: v.string(),
    learning_language_rtl: v.boolean(),
    course_short: v.string(),
    course_tags: v.array(v.string()),
    elements: v.array(v.any()),
    illustrations: v.object({
      gilded: v.string(),
      active: v.string(),
      locked: v.string(),
    }),
  }),
  v.null(),
);

const storyMetaResultValidator = v.union(
  v.object({
    from_language_name: v.string(),
    image: v.string(),
    from_language_long: v.string(),
    learning_language_long: v.string(),
    public: v.boolean(),
  }),
  // Deleted stories resolve to their course so the page can 308 there
  // instead of 404ing; never-existing ids stay null.
  v.object({
    deleted: v.literal(true),
    courseShort: v.string(),
    coursePublic: v.boolean(),
  }),
  v.null(),
);

const storyPreviewResultValidator = v.union(
  v.object({
    id: v.number(),
    title: v.string(),
    active: v.string(),
    gilded: v.string(),
  }),
  v.null(),
);

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : "";
}

export const getStoryByLegacyId = query({
  args: {
    storyId: v.number(),
  },
  returns: storyReadResultValidator,
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyId))
      .unique();
    if (!story || typeof story.legacyId !== "number") return null;
    if (story.deleted) return null;

    const storyJson = await getPublicStoryJson(ctx, story._id);
    if (!storyJson) return null;

    const course = await ctx.db.get(story.courseId);
    if (!course) return null;

    const [fromLanguage, learningLanguage, image] = await Promise.all([
      ctx.db.get(course.fromLanguageId),
      ctx.db.get(course.learningLanguageId),
      story.imageId ? ctx.db.get(story.imageId) : Promise.resolve(null),
    ]);
    if (!fromLanguage || !learningLanguage) return null;

    let parsedJson = storyJson;
    if (typeof parsedJson === "string") {
      try {
        parsedJson = JSON.parse(parsedJson);
      } catch {
        return null;
      }
    }

    const elements = await applyStoryCharacterNames(
      ctx,
      Array.isArray(parsedJson?.elements) ? parsedJson.elements : [],
      story.duo_id,
      course.learningLanguageId,
    );
    const illustrations = parsedJson?.illustrations ?? {};
    const active =
      nonEmptyString(illustrations.active) || (image?.active ?? "");
    const gilded =
      nonEmptyString(illustrations.gilded) || (image?.gilded ?? "");
    const locked =
      nonEmptyString(illustrations.locked) || (image?.locked ?? "");

    return {
      id: story.legacyId,
      set_id: story.set_id ?? 0,
      course_id: course.legacyId,
      from_language: fromLanguage.short,
      from_language_id: fromLanguage.legacyId,
      from_language_long: fromLanguage.name,
      from_language_rtl: fromLanguage.rtl,
      from_language_name: story.name,
      learning_language: learningLanguage.short,
      learning_language_long: learningLanguage.name,
      learning_language_rtl: learningLanguage.rtl,
      course_short: `${learningLanguage.short}-${fromLanguage.short}`,
      course_tags: course.tags ?? [],
      elements,
      illustrations: {
        gilded,
        active,
        locked,
      },
    };
  },
});

export const getStoryMetaByLegacyId = query({
  args: {
    storyId: v.number(),
  },
  returns: storyMetaResultValidator,
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyId))
      .unique();
    if (!story) return null;

    const course = await ctx.db.get(story.courseId);
    if (!course) return null;

    if (story.deleted) {
      return {
        deleted: true as const,
        courseShort: course.short ?? "",
        coursePublic: course.public,
      };
    }

    const [fromLanguage, learningLanguage, image] = await Promise.all([
      ctx.db.get(course.fromLanguageId),
      ctx.db.get(course.learningLanguageId),
      story.imageId ? ctx.db.get(story.imageId) : Promise.resolve(null),
    ]);

    if (!fromLanguage || !learningLanguage) return null;

    return {
      from_language_name: story.name,
      image: image?.legacyId ?? "",
      from_language_long: fromLanguage.name,
      learning_language_long: learningLanguage.name,
      public: story.public,
    };
  },
});

export const getStoryPreviewByLegacyId = query({
  args: {
    storyId: v.number(),
  },
  returns: storyPreviewResultValidator,
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyId))
      .unique();
    if (!story || story.deleted || typeof story.legacyId !== "number") {
      return null;
    }

    const storyJson = await getPublicStoryJson(ctx, story._id);
    const image = story.imageId ? await ctx.db.get(story.imageId) : null;

    let parsedJson = storyJson;
    if (typeof parsedJson === "string") {
      try {
        parsedJson = JSON.parse(parsedJson);
      } catch {
        parsedJson = null;
      }
    }

    const illustrations = parsedJson?.illustrations ?? {};
    const active =
      nonEmptyString(illustrations.active) || (image?.active ?? "");
    const gilded =
      nonEmptyString(illustrations.gilded) || (image?.gilded ?? active);

    return {
      id: story.legacyId,
      title: story.name,
      active,
      gilded,
    };
  },
});
