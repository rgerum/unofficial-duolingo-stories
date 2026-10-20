import { cache } from "react";
import { fetchQuery } from "convex/nextjs";
import { cacheLife, cacheTag } from "next/cache";
import { api } from "@convex/_generated/api";

// Neighbouring stories change when a story of the same course is published,
// renamed, reordered or deleted; those writes revalidate
// `course-links-<short>` (see getStory.ts for the caching rationale).
async function get_story_cross_links_cached(story_id: number) {
  "use cache";
  cacheTag(`story-${story_id}`);
  try {
    const crossLinks = await fetchQuery(
      api.storyCrossLinks.getStoryCrossLinks,
      { storyId: story_id },
    );
    if (crossLinks) {
      cacheTag(`course-links-${crossLinks.course.short}`);
      cacheLife("weeks");
    } else {
      // No course short to tag (e.g. the course isn't public yet), so fall
      // back to a shorter refresh. Only affects noindexed private stories.
      cacheLife("days");
    }
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

export const get_story_cross_links = cache(get_story_cross_links_cached);

export type StoryCrossLinksData = NonNullable<
  Awaited<ReturnType<typeof get_story_cross_links>>
>;
