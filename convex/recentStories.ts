import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { type Infer, v } from "convex/values";

const recentStoryValidator = v.object({
  id: v.number(),
  title: v.string(),
  setIndex: v.number(),
  active: v.string(),
  activeLip: v.string(),
});

const recentStorySetValidator = v.object({
  datePublished: v.number(),
  setId: v.number(),
  course: v.object({
    courseSlug: v.string(),
    seriesTitle: v.optional(v.string()),
    learningLanguageName: v.string(),
    fromLanguageName: v.string(),
  }),
  stories: v.array(recentStoryValidator),
});

type RecentStory = Infer<typeof recentStoryValidator>;
type RecentStorySet = Infer<typeof recentStorySetValidator>;
const MAX_RECENT_SETS = 20;

export const getRecentPublishedStorySets = query({
  args: {},
  returns: v.array(recentStorySetValidator),
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
        (
          story,
        ): story is typeof story & {
          date_published: number;
          set_id: number;
          set_index: number;
        } =>
          story.date_published !== undefined &&
          story.date_published > 0 &&
          story.set_id !== undefined &&
          story.set_index !== undefined,
      )
      .sort((a, b) => b.date_published - a.date_published);

    const sets = new Map<string, RecentStorySet>();
    const courseCache = new Map<
      Id<"courses">,
      RecentStorySet["course"] | null
    >();

    for (const story of stories) {
      const key = `${story.courseId}:${story.set_id}:${story.date_published}`;
      if (sets.size === MAX_RECENT_SETS && !sets.has(key)) {
        continue;
      }
      if (story.legacyId === undefined || !story.imageId) continue;

      let course = courseCache.get(story.courseId);
      if (course === undefined) {
        const courseRow = await ctx.db.get(story.courseId);
        if (!courseRow?.public || !courseRow.short) {
          courseCache.set(story.courseId, null);
          continue;
        }
        const [learningLanguage, fromLanguage] = await Promise.all([
          ctx.db.get(courseRow.learningLanguageId),
          ctx.db.get(courseRow.fromLanguageId),
        ]);
        course = {
          courseSlug: courseRow.short,
          seriesTitle: courseRow.name || undefined,
          learningLanguageName: learningLanguage?.name ?? "",
          fromLanguageName: fromLanguage?.name ?? "",
        };
        courseCache.set(story.courseId, course);
      }
      if (!course) continue;

      const image = await ctx.db.get(story.imageId);
      if (!image) continue;

      const existingSet = sets.get(key);
      const recentStory: RecentStory = {
        id: story.legacyId,
        title: story.name,
        setIndex: story.set_index,
        active: image.active,
        activeLip: image.active_lip,
      };
      if (existingSet) {
        existingSet.stories.push(recentStory);
      } else if (sets.size < MAX_RECENT_SETS) {
        sets.set(key, {
          datePublished: story.date_published,
          setId: story.set_id,
          course,
          stories: [recentStory],
        });
      }
    }

    return Array.from(sets.values()).map((set) => ({
      ...set,
      stories: set.stories.sort((a, b) => a.setIndex - b.setIndex),
    }));
  },
});
