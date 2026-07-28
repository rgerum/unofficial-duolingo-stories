import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

export async function get_story_cross_links(story_id: number) {
  try {
    return await fetchQuery(api.storyCrossLinks.getStoryCrossLinks, {
      storyId: story_id,
    });
  } catch (error) {
    // The block is an enhancement — never let it take down the story page.
    // Notably, Vercel previews talk to the prod Convex deployment, which
    // doesn't have this function until the branch merges.
    console.error("get_story_cross_links failed:", error);
    return null;
  }
}

export type StoryCrossLinksData = NonNullable<
  Awaited<ReturnType<typeof get_story_cross_links>>
>;
