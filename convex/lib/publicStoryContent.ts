import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeConvexValue(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeConvexValue(item))
      .filter((item) => item !== undefined);
  }
  if (!isRecord(value)) return value;

  const result: RecordValue = {};
  for (const [key, item] of Object.entries(value)) {
    const next = sanitizeConvexValue(item);
    if (next !== undefined) result[key] = next;
  }
  return result;
}

function compactAudio(value: unknown): unknown {
  if (!isRecord(value)) return undefined;

  const audio: RecordValue = {};
  if (typeof value.url === "string" && value.url.length > 0) {
    audio.url = value.url;
  }
  if (Array.isArray(value.keypoints) && value.keypoints.length > 0) {
    audio.keypoints = sanitizeConvexValue(value.keypoints);
  }

  return Object.keys(audio).length > 0 ? audio : undefined;
}

function compactStoryValue(
  value: unknown,
  path: readonly string[] = [],
): unknown {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => compactStoryValue(item, [...path, String(index)]))
      .filter((item) => item !== undefined);
  }
  if (!isRecord(value)) return value;

  const isTopLevelElement =
    path.length === 2 && path[0] === "elements" && /^\d+$/.test(path[1] ?? "");
  const result: RecordValue = {};

  for (const [key, item] of Object.entries(value)) {
    if (key === "editor") continue;
    if (key === "audio") {
      if (isTopLevelElement) continue;
      const audio = compactAudio(item);
      if (audio !== undefined) result.audio = audio;
      continue;
    }
    if (key === "ssml") continue;

    const next = compactStoryValue(item, [...path, key]);
    if (next !== undefined) result[key] = next;
  }

  return result;
}

export function toPublicStoryJson(json: unknown): unknown {
  return sanitizeConvexValue(compactStoryValue(json));
}

export async function upsertPublicStoryContent(
  ctx: MutationCtx,
  storyId: Id<"stories">,
  json: unknown,
  lastUpdated: number,
) {
  const publicJson = toPublicStoryJson(json);
  const existing = await ctx.db
    .query("story_public_content")
    .withIndex("by_story", (q) => q.eq("storyId", storyId))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      json: publicJson,
      lastUpdated,
    });
    return existing._id;
  }

  return await ctx.db.insert("story_public_content", {
    storyId,
    json: publicJson,
    lastUpdated,
  });
}

export async function getPublicStoryJson(
  ctx: QueryCtx,
  storyId: Id<"stories">,
) {
  const publicContent = await ctx.db
    .query("story_public_content")
    .withIndex("by_story", (q) => q.eq("storyId", storyId))
    .unique();

  if (publicContent) return publicContent.json;

  const legacyContent = await ctx.db
    .query("story_content")
    .withIndex("by_story", (q) => q.eq("storyId", storyId))
    .unique();

  return legacyContent?.json ?? null;
}
