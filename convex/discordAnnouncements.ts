"use node";

import { internal } from "./_generated/api";
import { env, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { formatPublicationAnnouncement } from "./lib/discordAnnouncements";

const MAX_ATTEMPTS = 5;
const DEFAULT_CHANNEL_NAME = "general-everyone";

const sharedAnnouncementArgs = {
  eventKey: v.string(),
  learningLanguage: v.string(),
  fromLanguage: v.string(),
  courseShort: v.string(),
  totalStoryCount: v.number(),
};

const announcementArgs = v.union(
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

export const postPublicationAnnouncement = internalAction({
  args: {
    announcement: announcementArgs,
    attempt: v.number(),
  },
  returns: v.object({
    posted: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { announcement, attempt } = args;
    const token = env.DISCORD_TOKEN ?? env.DISCORD_BOT_TOKEN;
    const channelId = env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID;
    if (!token || !channelId) {
      console.error(
        `discord-announcement: missing DISCORD_TOKEN/DISCORD_BOT_TOKEN or DISCORD_ANNOUNCEMENTS_CHANNEL_ID for #${DEFAULT_CHANNEL_NAME}`,
      );
      return { posted: false, reason: "missing_config" };
    }

    try {
      const response = await fetch(
        `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
        {
          method: "POST",
          headers: {
            authorization: `Bot ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            content: formatPublicationAnnouncement(announcement),
            nonce: announcement.eventKey,
            enforce_nonce: true,
          }),
        },
      );

      if (!response.ok) {
        const details = (await response.text()).slice(0, 500);
        throw new Error(`Discord HTTP ${response.status}: ${details}`);
      }

      return { posted: true };
    } catch (error) {
      console.error("discord-announcement: post failed", {
        eventKey: announcement.eventKey,
        attempt,
        error,
      });
      if (attempt < MAX_ATTEMPTS) {
        const delayMs = 2 ** (attempt - 1) * 60_000;
        await ctx.scheduler.runAfter(
          delayMs,
          internal.discordAnnouncements.postPublicationAnnouncement,
          { announcement, attempt: attempt + 1 },
        );
      }
      return { posted: false, reason: "request_failed" };
    }
  },
});
