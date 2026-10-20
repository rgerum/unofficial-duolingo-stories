import { cache } from "react";
import { fetchQuery } from "convex/nextjs";
import { cacheLife, cacheTag } from "next/cache";
import { api } from "@convex/_generated/api";

// Must match courseDataTag in convex/lib/siteRevalidation.ts.
export function courseDataTag(courseId: number) {
  return `course-data-${courseId}`;
}

// Anonymous reads, so safe to share across visitors. Cached so story pages
// can be prerendered and served from the ISR cache instead of hitting Convex
// on every view.
//
// Every edit that changes what a story page shows revalidates its tags
// (convex/lib/siteRevalidation.ts): `story-<id>` for the story itself and its
// neighbours' links, and `course-data-<courseId>` for course-level data
// (course name, tags and visibility, language names). So the lifetime here is
// only a fallback and can be long - with "hours" crawlers re-rendered every
// story page about twice a day.
//
// React `cache` dedupes the generateMetadata and Page calls within one render:
// on Vercel, `use cache` entries live in per-instance memory and don't persist
// across requests or revalidations, so it doesn't dedupe them by itself.
// (The exports must come after the definitions: the `use cache` compiler
// turns those function declarations into non-hoisted constants.)
async function get_story_cached(story_id: number) {
  "use cache";
  cacheLife("weeks");
  cacheTag(`story-${story_id}`);
  const story = await fetchQuery(api.storyRead.getStoryByLegacyId, {
    storyId: story_id,
  });
  if (story) cacheTag(courseDataTag(story.course_id));
  return story;
}

async function get_story_meta_cached(story_id: number) {
  "use cache";
  cacheLife("weeks");
  cacheTag(`story-${story_id}`);
  const meta = await fetchQuery(api.storyRead.getStoryMetaByLegacyId, {
    storyId: story_id,
  });
  // Optional while an older Convex deployment may still be serving.
  if (typeof meta?.course_id === "number") {
    cacheTag(courseDataTag(meta.course_id));
  }
  return meta;
}

export const get_story = cache(get_story_cached);
export const get_story_meta = cache(get_story_meta_cached);

export type StoryData = NonNullable<Awaited<ReturnType<typeof get_story>>>;
