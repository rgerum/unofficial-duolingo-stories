import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

export async function get_story(story_id: number) {
  return await fetchQuery(api.storyRead.getStoryByLegacyId, {
    storyId: story_id,
  });
}

export type StoryData = NonNullable<Awaited<ReturnType<typeof get_story>>>;
