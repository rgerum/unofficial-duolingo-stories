import { query } from "./_generated/server";
import { v } from "convex/values";

// Type matching PostgreSQL output for compatibility
export interface CourseDataCompat {
  id: string; // Convex ID
  legacyId: number | undefined;
  short: string;
  name: string;
  count: number;
  about: string | undefined;
  from_language: number | undefined;
  from_language_name: string | undefined;
  learning_language: number | undefined;
  learning_language_name: string | undefined;
}

/**
 * Get all courses
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});

/**
 * Get all public courses
 */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_public", (q) => q.eq("public", true))
      .collect();
  },
});

/**
 * Get a course by its short code
 */
export const getByShort = query({
  args: { short: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_short", (q) => q.eq("short", args.short))
      .first();
  },
});

/**
 * Get a course by ID
 */
export const get = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get a course with its languages (replaces JOIN query)
 */
export const getWithLanguages = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    if (!course) return null;

    const learningLanguage = await ctx.db.get(course.learningLanguageId);
    const fromLanguage = await ctx.db.get(course.fromLanguageId);

    return {
      ...course,
      learningLanguage,
      fromLanguage,
    };
  },
});

/**
 * Get a course by short code with its languages
 */
export const getByShortWithLanguages = query({
  args: { short: v.string() },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_short", (q) => q.eq("short", args.short))
      .first();

    if (!course) return null;

    const learningLanguage = await ctx.db.get(course.learningLanguageId);
    const fromLanguage = await ctx.db.get(course.fromLanguageId);

    return {
      ...course,
      learningLanguage,
      fromLanguage,
    };
  },
});

/**
 * Get all public courses with language details
 */
export const listPublicWithLanguages = query({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_public", (q) => q.eq("public", true))
      .collect();

    // Batch fetch all languages
    const languageIds = new Set<string>();
    for (const course of courses) {
      languageIds.add(course.learningLanguageId);
      languageIds.add(course.fromLanguageId);
    }

    const languages = new Map();
    for (const id of Array.from(languageIds)) {
      const lang = await ctx.db.get(id as any);
      if (lang) languages.set(id, lang);
    }

    return courses.map((course) => ({
      ...course,
      learningLanguage: languages.get(course.learningLanguageId),
      fromLanguage: languages.get(course.fromLanguageId),
    }));
  },
});

/**
 * Get a course by legacy PostgreSQL ID (for migration)
 */
export const getByLegacyId = query({
  args: { legacyId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.legacyId))
      .first();
  },
});

/**
 * Get public courses in PostgreSQL-compatible format for comparison
 * Matches the output of get_course_data() from get_course_data.ts
 */
export const listPublicForComparison = query({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_public", (q) => q.eq("public", true))
      .collect();

    // Batch fetch all languages
    const languageIds = new Set<string>();
    for (const course of courses) {
      languageIds.add(course.learningLanguageId);
      languageIds.add(course.fromLanguageId);
    }

    const languages = new Map();
    for (const id of Array.from(languageIds)) {
      const lang = await ctx.db.get(id as any);
      if (lang) languages.set(id, lang);
    }

    // Transform to match PostgreSQL output format
    const result = courses.map((course) => {
      const learningLang = languages.get(course.learningLanguageId);
      const fromLang = languages.get(course.fromLanguageId);

      return {
        id: course.legacyId ?? 0,
        short: course.short,
        // Match PostgreSQL: COALESCE(NULLIF(name, ''), learning_language_name)
        name: course.name && course.name !== "" ? course.name : (course.learning_language_name ?? ""),
        count: course.count ?? 0,
        about: course.about ?? "",
        from_language: fromLang?.legacyId ?? 0,
        from_language_name: course.from_language_name ?? fromLang?.name ?? "",
        learning_language: learningLang?.legacyId ?? 0,
        learning_language_name: course.learning_language_name ?? learningLang?.name ?? "",
      };
    });

    // Sort by from_language_name, then name (matching PostgreSQL ORDER BY)
    result.sort((a, b) => {
      const langCompare = (a.from_language_name ?? "").localeCompare(b.from_language_name ?? "");
      if (langCompare !== 0) return langCompare;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

    return result;
  },
});

/**
 * Get course groups (unique from_language values) for the listing page
 */
export const getCourseGroups = query({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_public", (q) => q.eq("public", true))
      .collect();

    // Get unique from_languages, prioritizing English first
    const groups: { from_language: number; from_language_name: string }[] = [];
    const seen = new Set<number>();

    // First pass: find English (assume legacyId 1)
    for (const course of courses) {
      const fromLang = await ctx.db.get(course.fromLanguageId);
      if (fromLang?.legacyId === 1 && !seen.has(1)) {
        groups.push({
          from_language: 1,
          from_language_name: course.from_language_name ?? fromLang?.name ?? "English",
        });
        seen.add(1);
        break;
      }
    }

    // Sort courses by from_language_name
    const sortedCourses = [...courses].sort((a, b) =>
      (a.from_language_name ?? "").localeCompare(b.from_language_name ?? "")
    );

    // Second pass: add other languages
    for (const course of sortedCourses) {
      const fromLang = await ctx.db.get(course.fromLanguageId);
      const legacyId = fromLang?.legacyId ?? 0;
      if (!seen.has(legacyId) && legacyId !== 1) {
        groups.push({
          from_language: legacyId,
          from_language_name: course.from_language_name ?? fromLang?.name ?? "",
        });
        seen.add(legacyId);
      }
    }

    return groups;
  },
});

/**
 * Get courses filtered by from_language (legacy ID)
 */
export const getCoursesInGroup = query({
  args: { fromLanguageLegacyId: v.number() },
  handler: async (ctx, args) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_public", (q) => q.eq("public", true))
      .collect();

    // Filter by from_language legacy ID
    const filtered = [];
    for (const course of courses) {
      const fromLang = await ctx.db.get(course.fromLanguageId);
      if (fromLang?.legacyId === args.fromLanguageLegacyId) {
        filtered.push({
          id: course.legacyId ?? 0,
          short: course.short,
          name: course.name && course.name !== "" ? course.name : (course.learning_language_name ?? ""),
          count: course.count ?? 0,
        });
      }
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return filtered;
  },
});
