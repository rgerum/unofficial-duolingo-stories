import { fetchQuery } from "convex/nextjs";
import { cache } from "react";
import { api } from "@convex/_generated/api";

export const get_story = cache(async (story_id: number) => {
  return await fetchQuery(api.storyRead.getStoryByLegacyId, {
    storyId: story_id,
  });
});

export type StoryData = NonNullable<Awaited<ReturnType<typeof get_story>>>;
