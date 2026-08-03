"use node";

import { internal } from "./_generated/api";
import { env, internalAction, type ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import {
  announcementArgs,
  formatPublicationAnnouncement,
  type PublicationAnnouncement,
} from "./lib/discordAnnouncements";

const MAX_ATTEMPTS = 5;
const DEFAULT_CHANNEL_NAME = "general-everyone";

type AnnouncementActionArgs = {
  announcement: PublicationAnnouncement;
  attempt: number;
  operationKey: string;
};

export async function deriveDiscordNonce(eventKey: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(eventKey),
  );
  return Array.from(new Uint8Array(digest).slice(0, 12), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function getRetryAfterMs(value: string | null) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const date = Date.parse(value);
  if (!Number.isFinite(date)) return null;
  return Math.max(0, date - Date.now());
}

export async function handlePublicationAnnouncement(
  ctx: { scheduler: Pick<ActionCtx["scheduler"], "runAfter"> },
  args: AnnouncementActionArgs,
) {
  const { announcement, attempt, operationKey } = args;
  const token = env.DISCORD_TOKEN ?? env.DISCORD_BOT_TOKEN;
  const channelId = env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID;
  if (!token || !channelId) {
    console.error(
      `discord-announcement: missing DISCORD_TOKEN/DISCORD_BOT_TOKEN or DISCORD_ANNOUNCEMENTS_CHANNEL_ID for #${DEFAULT_CHANNEL_NAME}`,
    );
    return { posted: false, reason: "missing_config" as const };
  }

  let failedStatus: number | null = null;
  let retryAfterMs: number | null = null;
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
          nonce: await deriveDiscordNonce(announcement.eventKey),
          enforce_nonce: true,
        }),
      },
    );

    if (!response.ok) {
      failedStatus = response.status;
      retryAfterMs = getRetryAfterMs(response.headers.get("retry-after"));
      const details = (await response.text()).slice(0, 500);
      throw new Error(`Discord HTTP ${response.status}: ${details}`);
    }

    return { posted: true };
  } catch (error) {
    console.error("discord-announcement: post failed", {
      eventKey: announcement.eventKey,
      operationKey,
      attempt,
      error,
    });
    const isPermanentClientError =
      failedStatus !== null &&
      failedStatus >= 400 &&
      failedStatus < 500 &&
      failedStatus !== 429;
    if (attempt < MAX_ATTEMPTS && !isPermanentClientError) {
      const exponentialDelayMs = 2 ** (attempt - 1) * 60_000;
      const delayMs =
        failedStatus === 429 && retryAfterMs !== null
          ? retryAfterMs
          : exponentialDelayMs;
      await ctx.scheduler.runAfter(
        delayMs,
        internal.discordAnnouncements.postPublicationAnnouncement,
        { announcement, attempt: attempt + 1, operationKey },
      );
    }
    return { posted: false, reason: "request_failed" as const };
  }
}

export const postPublicationAnnouncement = internalAction({
  args: {
    announcement: announcementArgs,
    attempt: v.number(),
    operationKey: v.string(),
  },
  returns: v.object({
    posted: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: handlePublicationAnnouncement,
});
