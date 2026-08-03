"use node";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { formatPublicationAnnouncement } from "./lib/discordAnnouncements";

const MAX_ATTEMPTS = 5;
const DEFAULT_CHANNEL_NAME = "general-everyone";

const announcementArgs = {
  eventKey: v.string(),
  kind: v.union(v.literal("course_published"), v.literal("set_published")),
  learningLanguage: v.string(),
  fromLanguage: v.string(),
  courseShort: v.string(),
  storyCount: v.optional(v.number()),
  attempt: v.number(),
};

export const postPublicationAnnouncement = internalAction({
  args: announcementArgs,
  returns: v.object({
    posted: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const token = process.env.DISCORD_TOKEN ?? process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID;
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
            content: formatPublicationAnnouncement(args),
            nonce: args.eventKey,
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
        eventKey: args.eventKey,
        attempt: args.attempt,
        error,
      });
      if (args.attempt < MAX_ATTEMPTS) {
        const delayMs = 2 ** (args.attempt - 1) * 60_000;
        await ctx.scheduler.runAfter(
          delayMs,
          internal.discordAnnouncements.postPublicationAnnouncement,
          { ...args, attempt: args.attempt + 1 },
        );
      }
      return { posted: false, reason: "request_failed" };
    }
  },
});
