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

const publicStoryListItemValidator = v.object({
  id: v.number(),
  name: v.string(),
  course_id: v.number(),
  image: v.string(),
  set_id: v.number(),
  set_index: v.number(),
  active: v.string(),
  gilded: v.string(),
  active_lip: v.string(),
  gilded_lip: v.string(),
});

const localizationEntryValidator = v.object({
  tag: v.string(),
  text: v.string(),
});

const publicCoursePageValidator = v.union(
  v.object({
    ...courseListItemValidator.fields,
    stories: v.array(publicStoryListItemValidator),
    localization: v.array(localizationEntryValidator),
  }),
  v.null(),
);

export const getPublicCoursePageData = query({
  args: {
    short: v.string(),
  },
  returns: publicCoursePageValidator,
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_short", (q) => q.eq("short", args.short))
      .unique();
    if (!course || !course.public || !course.short) return null;

    const languageRows = await Promise.all([
      ctx.db.get(course.fromLanguageId),
      ctx.db.get(course.learningLanguageId),
    ]);
    const fromLanguage = languageRows[0];
    const legacyFromLanguageId = fromLanguage?.legacyId ?? 0;
    const legacyLearningLanguageId = languageRows[1]?.legacyId ?? 0;

    const publicStories = await ctx.db
      .query("stories")
      .withIndex("by_course_public_deleted_set", (q) =>
        q.eq("courseId", course._id).eq("public", true).eq("deleted", false),
      )
      .collect();

    const imageIds = Array.from(
      new Set(
        publicStories
          .map((story) => story.imageId)
          .filter((imageId): imageId is Id<"images"> => !!imageId),
      ),
    );
    const imageRows = await Promise.all(
      imageIds.map(async (imageId) => ({
        imageId,
        image: await ctx.db.get(imageId),
      })),
    );
    const imageById = new Map<Id<"images">, (typeof imageRows)[number]["image"]>();
    for (const row of imageRows) imageById.set(row.imageId, row.image);

    const englishLanguage = await ctx.db
      .query("languages")
      .withIndex("by_short", (q) => q.eq("short", "en"))
      .unique();
    const englishRows = englishLanguage
      ? await ctx.db
          .query("localizations")
          .withIndex("by_language_id_and_tag", (q) =>
            q.eq("languageId", englishLanguage._id),
          )
          .collect()
      : [];
    const targetRows =
      !fromLanguage || fromLanguage._id === englishLanguage?._id
        ? englishRows
        : await ctx.db
            .query("localizations")
            .withIndex("by_language_id_and_tag", (q) =>
              q.eq("languageId", fromLanguage._id),
            )
            .collect();
    const localizationMap = new Map<string, string>();
    for (const row of englishRows) {
      if (!row.tag || !row.text) continue;
      localizationMap.set(row.tag, row.text);
    }
    for (const row of targetRows) {
      if (!row.tag || !row.text) continue;
      localizationMap.set(row.tag, row.text);
    }

    const mappedStories = publicStories
      .map((story) => {
        if (typeof story.legacyId !== "number") return null;
        const image = story.imageId ? imageById.get(story.imageId) : null;
        if (!image?.active || !image?.gilded) return null;
        return {
          id: story.legacyId,
          name: story.name,
          course_id: course.legacyId,
          image: image.legacyId,
          set_id: story.set_id ?? 0,
          set_index: story.set_index ?? 0,
          active: image.active,
          gilded: image.gilded,
          active_lip: image.active_lip,
          gilded_lip: image.gilded_lip,
        };
      })
      .filter(
        (
          story,
        ): story is {
          id: number;
          name: string;
          course_id: number;
          image: string;
          set_id: number;
          set_index: number;
          active: string;
          gilded: string;
          active_lip: string;
          gilded_lip: string;
        } => story !== null,
      )
      .sort((a, b) => {
        const setCmp = a.set_id - b.set_id;
        if (setCmp !== 0) return setCmp;
        return a.set_index - b.set_index;
      });

    return {
      id: course.legacyId,
      short: course.short,
      name:
        course.name && course.name.trim().length > 0
          ? course.name
          : (course.learning_language_name ?? ""),
      count: course.count ?? 0,
      about: course.about ?? "",
      from_language: legacyFromLanguageId,
      fromLanguageId: course.fromLanguageId as Id<"languages">,
      from_language_name: course.from_language_name ?? "",
      learning_language: legacyLearningLanguageId,
      learningLanguageId: course.learningLanguageId as Id<"languages">,
      learning_language_name: course.learning_language_name ?? "",
      stories: mappedStories,
      localization: Array.from(localizationMap.entries()).map(([tag, text]) => ({
        tag,
        text,
      })),
    };
  },
});
