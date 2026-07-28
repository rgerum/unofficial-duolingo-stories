import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

export async function get_story_cross_links(story_id: number) {
  return await fetchQuery(api.storyCrossLinks.getStoryCrossLinks, {
    storyId: story_id,
  });
}

export type StoryCrossLinksData = NonNullable<
  Awaited<ReturnType<typeof get_story_cross_links>>
>;
