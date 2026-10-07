import { fetchQuery } from "convex/nextjs";
import { cacheLife, cacheTag } from "next/cache";
import { api } from "@convex/_generated/api";

// Anonymous reads, so safe to share across visitors. Cached so story pages
// can be prerendered and served from the ISR cache instead of hitting Convex
// on every view.
export async function get_story(story_id: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(`story-${story_id}`);
  return await fetchQuery(api.storyRead.getStoryByLegacyId, {
    storyId: story_id,
  });
}

export async function get_story_meta(story_id: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(`story-${story_id}`);
  return await fetchQuery(api.storyRead.getStoryMetaByLegacyId, {
    storyId: story_id,
  });
}

export type StoryData = NonNullable<Awaited<ReturnType<typeof get_story>>>;
