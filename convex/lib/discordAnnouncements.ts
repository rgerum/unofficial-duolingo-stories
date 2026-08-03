import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { type Infer, v } from "convex/values";

const sharedAnnouncementArgs = {
  eventKey: v.string(),
  learningLanguage: v.string(),
  fromLanguage: v.string(),
  courseShort: v.string(),
  totalStoryCount: v.number(),
};

export const announcementArgs = v.union(
  v.object({
    ...sharedAnnouncementArgs,
    kind: v.literal("course_published"),
  }),
  v.object({
    ...sharedAnnouncementArgs,
    kind: v.literal("set_published"),
    storyCount: v.number(),
  }),
);

export type PublicationAnnouncement = Infer<typeof announcementArgs>;

export function formatPublicationAnnouncement(args: PublicationAnnouncement) {
  const courseUrl = `https://duostories.org/${encodeURIComponent(args.courseShort)}`;
  if (args.kind === "course_published") {
    return [
      `🎉 A new ${args.learningLanguage} course for ${args.fromLanguage} speakers is now available on DuoStories!`,
      `The course now has ${args.totalStoryCount} published ${args.totalStoryCount === 1 ? "story" : "stories"}.`,
      courseUrl,
    ].join("\n");
  }

  const storyLabel = args.storyCount === 1 ? "story" : "stories";
  return [
    `📚 A new set of ${args.storyCount} ${args.learningLanguage} ${storyLabel} for ${args.fromLanguage} speakers is now available on DuoStories!`,
    `The course now has ${args.totalStoryCount} published ${args.totalStoryCount === 1 ? "story" : "stories"}.`,
    courseUrl,
  ].join("\n");
}

export async function schedulePublicationAnnouncement(
  ctx: MutationCtx,
  args: PublicationAnnouncement,
) {
  await ctx.scheduler.runAfter(
    0,
    internal.discordAnnouncements.postPublicationAnnouncement,
    { announcement: args, attempt: 1, operationKey: args.eventKey },
  );
}
