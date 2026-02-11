import { query } from "./_generated/server";
import { v } from "convex/values";

const storyReadResultValidator = v.union(
  v.object({
    id: v.number(),
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
    elements: v.array(v.any()),
    illustrations: v.object({
      gilded: v.string(),
      active: v.string(),
      locked: v.string(),
    }),
  }),
  v.null(),
);

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

    const storyContent = await ctx.db
      .query("story_content")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .unique();
    if (!storyContent) return null;

    const course = await ctx.db.get(story.courseId);
    if (!course) return null;

    const fromLanguage = await ctx.db.get(course.fromLanguageId);
    const learningLanguage = await ctx.db.get(course.learningLanguageId);
    if (!fromLanguage || !learningLanguage) return null;

    let parsedJson = storyContent.json;
    if (typeof parsedJson === "string") {
      try {
        parsedJson = JSON.parse(parsedJson);
      } catch {
        return null;
      }
    }

    const elements = Array.isArray(parsedJson?.elements)
      ? parsedJson.elements
      : [];
    const illustrations = parsedJson?.illustrations ?? {};

    return {
      id: story.legacyId,
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
      elements,
      illustrations: {
        gilded: String(illustrations.gilded ?? ""),
        active: String(illustrations.active ?? ""),
        locked: String(illustrations.locked ?? ""),
      },
    };
  },
});
