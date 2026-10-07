import { fetchQuery } from "convex/nextjs";
import { cacheLife, cacheTag } from "next/cache";
import { api } from "@convex/_generated/api";

export async function get_story_cross_links(story_id: number) {
  "use cache";
  cacheTag(`story-${story_id}`);
  try {
    const crossLinks = await fetchQuery(
      api.storyCrossLinks.getStoryCrossLinks,
      { storyId: story_id },
    );
    cacheLife("hours");
    return crossLinks;
  } catch (error) {
    // The block is an enhancement — never let it take down the story page.
    // Notably, Vercel previews talk to the prod Convex deployment, which
    // doesn't have this function until the branch merges.
    console.error("get_story_cross_links failed:", error);
    // Retry soon rather than caching the failure for hours.
    cacheLife("minutes");
    return null;
  }
}

export type StoryCrossLinksData = NonNullable<
  Awaited<ReturnType<typeof get_story_cross_links>>
>;
