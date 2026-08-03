import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";

type SharedPublicationAnnouncement = {
  eventKey: string;
  learningLanguage: string;
  fromLanguage: string;
  courseShort: string;
  totalStoryCount: number;
};

export type PublicationAnnouncement = SharedPublicationAnnouncement &
  (
    | { kind: "course_published" }
    | { kind: "set_published"; storyCount: number }
  );

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
    { announcement: args, attempt: 1 },
  );
}
