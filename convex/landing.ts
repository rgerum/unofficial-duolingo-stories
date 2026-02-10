import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const courseListItemValidator = v.object({
  id: v.number(),
  short: v.string(),
  name: v.string(),
  count: v.number(),
  about: v.string(),
  from_language: v.number(),
  fromLanguageId: v.id("languages"),
  from_language_name: v.string(),
  learning_language: v.number(),
  learningLanguageId: v.id("languages"),
  learning_language_name: v.string(),
});

export const getPublicCourseList = query({
  args: {},
  returns: v.array(courseListItemValidator),
  handler: async (ctx) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_public", (q) => q.eq("public", true))
      .collect();

    const languageIds = new Set<Id<"languages">>();
    for (const course of courses) {
      languageIds.add(course.fromLanguageId);
      languageIds.add(course.learningLanguageId);
    }
    const languageRows = await Promise.all(
      Array.from(languageIds).map(async (languageId) => ({
        languageId,
        language: await ctx.db.get(languageId),
      })),
    );
    const legacyLanguageIdByConvexId = new Map<Id<"languages">, number>();
    for (const row of languageRows) {
      if (!row.language) continue;
      legacyLanguageIdByConvexId.set(row.languageId, row.language.legacyId);
    }

    return courses
      .map((course) => {
        if (!course.short) return null;

        return {
          id: course.legacyId,
          short: course.short,
          name:
            course.name && course.name.trim().length > 0
              ? course.name
              : (course.learning_language_name ?? ""),
          count: course.count ?? 0,
          about: course.about ?? "",
          from_language: legacyLanguageIdByConvexId.get(course.fromLanguageId) ?? 0,
          fromLanguageId: course.fromLanguageId as Id<"languages">,
          from_language_name: course.from_language_name ?? "",
          learning_language:
            legacyLanguageIdByConvexId.get(course.learningLanguageId) ?? 0,
          learningLanguageId: course.learningLanguageId as Id<"languages">,
          learning_language_name: course.learning_language_name ?? "",
        };
      })
      .filter(
        (
          course,
        ): course is {
          id: number;
          short: string;
          name: string;
          count: number;
          about: string;
          from_language: number;
          fromLanguageId: Id<"languages">;
          from_language_name: string;
          learning_language: number;
          learningLanguageId: Id<"languages">;
          learning_language_name: string;
        } => course !== null,
      )
      .sort((a, b) => {
        const fromCmp = a.from_language_name.localeCompare(b.from_language_name);
        if (fromCmp !== 0) return fromCmp;
        return a.name.localeCompare(b.name);
      });
  },
});
