import { cache } from "react";
import { fetchQuery } from "convex/nextjs";
import { cacheLife, cacheTag } from "next/cache";
import { api } from "@convex/_generated/api";
import { courseDataTag } from "./getStory";

// Neighbouring stories change when a story next to this one is published,
// renamed, re-illustrated, reordered or deleted; those writes revalidate this
// story's `story-<id>` tag. Course-level changes (name, visibility) revalidate
// `course-data-<courseId>`, which is tagged even when there are no links so a
// course going public shows them. See getStory.ts for the caching rationale.
async function get_story_cross_links_cached(
  story_id: number,
  course_id: number,
) {
  "use cache";
  cacheTag(`story-${story_id}`, courseDataTag(course_id));
  try {
    const crossLinks = await fetchQuery(
      api.storyCrossLinks.getStoryCrossLinks,
      { storyId: story_id },
    );
    cacheLife("weeks");
    return crossLinks;
  } catch (error) {
    // The block is an enhancement — never let it take down the story page.
    // Notably, Vercel previews talk to the dev Convex deployment, which may
    // not have this function until it is deployed there.
    console.error("get_story_cross_links failed:", error);
    // Retry soon rather than caching the failure for weeks.
    cacheLife("minutes");
    return null;
  }
}

export const get_story_cross_links = cache(get_story_cross_links_cached);

export type StoryCrossLinksData = NonNullable<
  Awaited<ReturnType<typeof get_story_cross_links>>
>;
