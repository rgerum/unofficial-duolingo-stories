import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

const convexUrl = process.env.VITE_CONVEX_URL ?? process.env.CONVEX_URL ?? "";

if (!convexUrl) {
  throw new Error("Missing VITE_CONVEX_URL/CONVEX_URL");
}

const convex = new ConvexHttpClient(convexUrl);

export async function get_story(story_id: number) {
  return await convex.query(api.storyRead.getStoryByLegacyId, {
    storyId: story_id,
  });
}

export type StoryData = NonNullable<Awaited<ReturnType<typeof get_story>>>;
