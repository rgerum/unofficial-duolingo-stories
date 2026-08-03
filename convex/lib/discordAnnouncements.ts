import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";

export type PublicationAnnouncement = {
  eventKey: string;
  kind: "course_published" | "set_published";
  learningLanguage: string;
  fromLanguage: string;
  courseShort: string;
  storyCount?: number;
};

export function formatPublicationAnnouncement(args: PublicationAnnouncement) {
  const courseUrl = `https://duostories.org/${encodeURIComponent(args.courseShort)}`;
  if (args.kind === "course_published") {
    return [
      `🎉 A new ${args.learningLanguage} course for ${args.fromLanguage} speakers is now available on DuoStories!`,
      courseUrl,
    ].join("\n");
  }

  const storyLabel = args.storyCount === 1 ? "story" : "stories";
  return [
    `📚 A new set of ${args.storyCount ?? 0} ${args.learningLanguage} ${storyLabel} for ${args.fromLanguage} speakers is now available on DuoStories!`,
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
    { ...args, attempt: 1 },
  );
}
