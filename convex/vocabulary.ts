import { v } from "convex/values";

import { query } from "./_generated/server";
import { requireAdmin } from "./lib/authorization";
import { getPublicStoryJson } from "./lib/publicStoryContent";
import { listPublicCourseStories } from "./lib/publicCourseStories";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getStoryLines(json: unknown) {
  if (!isRecord(json) || !Array.isArray(json.elements)) return [];

  const lines: string[] = [];
  for (const element of json.elements) {
    if (!isRecord(element) || element.type !== "LINE") continue;
    const line = element.line;
    if (!isRecord(line) || !isRecord(line.content)) continue;
    const text = line.content.text;
    if (typeof text === "string" && text.trim().length > 0) lines.push(text);
  }
  return lines;
}

const vocabularyStoryValidator = v.object({
  id: v.number(),
  name: v.string(),
  setId: v.number(),
  setIndex: v.number(),
  lines: v.array(v.string()),
});

export const getCourseVocabularySourceForAdmin = query({
  args: { short: v.string() },
  returns: v.union(
    v.object({
      short: v.string(),
      name: v.string(),
      learningLanguageName: v.string(),
      stories: v.array(vocabularyStoryValidator),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const course = await ctx.db
      .query("courses")
      .withIndex("by_short", (q) => q.eq("short", args.short))
      .unique();
    if (!course?.public || !course.short) return null;

    const [learningLanguage, publicStories] = await Promise.all([
      ctx.db.get(course.learningLanguageId),
      listPublicCourseStories(ctx, course._id),
    ]);

    const stories = await Promise.all(
      publicStories.map(async ({ story, legacyId, set_id, set_index }) => ({
        id: legacyId,
        name: story.name,
        setId: set_id,
        setIndex: set_index,
        lines: getStoryLines(await getPublicStoryJson(ctx, story._id)),
      })),
    );
    const learningLanguageName = learningLanguage?.name ?? "";

    return {
      short: course.short,
      name: course.name?.trim() || learningLanguageName,
      learningLanguageName,
      stories,
    };
  },
});
