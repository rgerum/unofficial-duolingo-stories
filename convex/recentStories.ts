import { query } from "./_generated/server";
import { v } from "convex/values";

const recentStoryValidator = v.object({
  id: v.number(),
  name: v.string(),
  datePublished: v.number(),
  image: v.string(),
  active: v.string(),
  activeLip: v.string(),
  course: v.object({
    short: v.string(),
    name: v.string(),
    learningLanguageName: v.string(),
    fromLanguageName: v.string(),
  }),
});

export const getRecentPublishedStories = query({
  args: {},
  returns: v.array(recentStoryValidator),
  handler: async (ctx) => {
    const stories = (
      await ctx.db
        .query("stories")
        .withIndex("by_public", (q) =>
          q.eq("public", true).eq("deleted", false),
        )
        .collect()
    )
      .filter(
        (story): story is typeof story & { date_published: number } =>
          story.date_published !== undefined && story.date_published > 0,
      )
      .sort((a, b) => b.date_published - a.date_published);

    const rows = [];
    for (const story of stories) {
      if (rows.length === 50) break;
      if (story.legacyId === undefined || !story.imageId) continue;

      const [course, image] = await Promise.all([
        ctx.db.get(story.courseId),
        ctx.db.get(story.imageId),
      ]);
      if (!course?.public || !course.short || !image) continue;

      const [learningLanguage, fromLanguage] = await Promise.all([
        ctx.db.get(course.learningLanguageId),
        ctx.db.get(course.fromLanguageId),
      ]);
      const learningLanguageName = learningLanguage?.name ?? "";

      rows.push({
        id: story.legacyId,
        name: story.name,
        datePublished: story.date_published,
        image: image.legacyId,
        active: image.active,
        activeLip: image.active_lip,
        course: {
          short: course.short,
          name:
            course.name && course.name.trim().length > 0
              ? course.name
              : learningLanguageName,
          learningLanguageName,
          fromLanguageName: fromLanguage?.name ?? "",
        },
      });
    }

    return rows;
  },
});
