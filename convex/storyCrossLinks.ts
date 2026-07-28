import { v } from "convex/values";
import { query } from "./_generated/server";
import { listPublicCourseStories } from "./lib/publicCourseStories";
import {
  type CrossLinkCandidate,
  selectStoryCrossLinks,
} from "./lib/storyCrossLinks";

const crossLinkStoryValidator = v.object({
  id: v.number(),
  name: v.string(),
});

const storyCrossLinksValidator = v.union(
  v.object({
    course: v.object({
      short: v.string(),
      name: v.string(),
      learning_language_name: v.string(),
    }),
    previous: v.union(crossLinkStoryValidator, v.null()),
    next: v.union(crossLinkStoryValidator, v.null()),
    more: v.array(crossLinkStoryValidator),
  }),
  v.null(),
);

/**
 * Internal links shown on a story page: the neighbouring stories of the same
 * course plus a few more siblings.
 *
 * Story pages used to have exactly one inbound internal link (their course
 * page), which left most of them in Search Console's "Discovered - currently
 * not indexed" bucket. These links give every story several crawl paths.
 *
 * Only publicly listed stories of public courses are ever returned - the
 * candidates come from `listPublicCourseStories`, the same helper the public
 * course page listing uses.
 */
export const getStoryCrossLinks = query({
  args: {
    storyId: v.number(),
  },
  returns: storyCrossLinksValidator,
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query("stories")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", args.storyId))
      .unique();
    if (!story || story.deleted) return null;

    const course = await ctx.db.get(story.courseId);
    if (!course || !course.public || !course.short) return null;

    const learningLanguage = await ctx.db.get(course.learningLanguageId);
    const learningLanguageName = learningLanguage?.name ?? "";

    const siblings = await listPublicCourseStories(ctx, course._id);
    const candidates: CrossLinkCandidate[] = siblings.map((entry) => ({
      id: entry.legacyId,
      name: entry.story.name,
      set_id: entry.set_id,
      set_index: entry.set_index,
    }));

    const { previous, next, more } = selectStoryCrossLinks(candidates, {
      // `args.storyId` is the legacy id this story was looked up by.
      id: args.storyId,
      name: story.name,
      set_id: story.set_id ?? 0,
      set_index: story.set_index ?? 0,
    });

    return {
      course: {
        short: course.short,
        name:
          course.name && course.name.trim().length > 0
            ? course.name
            : learningLanguageName,
        learning_language_name: learningLanguageName,
      },
      previous: previous ? { id: previous.id, name: previous.name } : null,
      next: next ? { id: next.id, name: next.name } : null,
      more: more.map((sibling) => ({ id: sibling.id, name: sibling.name })),
    };
  },
});
