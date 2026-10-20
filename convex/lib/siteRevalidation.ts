import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { listNearbyPublicCourseStories } from "./publicCourseStories";
import { selectStoryCrossLinks } from "./storyCrossLinks";

// /api/revalidate accepts at most 100 tags per request.
const MAX_TAGS_PER_REQUEST = 100;

// For writes whose tag count isn't bounded (e.g. one per affected story).
export async function scheduleSiteRevalidation(
  ctx: MutationCtx,
  tags: string[],
) {
  const unique = [...new Set(tags)];
  for (let i = 0; i < unique.length; i += MAX_TAGS_PER_REQUEST) {
    await ctx.scheduler.runAfter(0, internal.siteCache.revalidate, {
      tags: unique.slice(i, i + MAX_TAGS_PER_REQUEST),
    });
  }
}

// Course-level data shown on every story page of a course (course name, tags
// and visibility, language names and direction). Keyed by the immutable legacy
// course id: course shorts are slugs and can drift from the language shorts.
export function courseDataTag(courseLegacyId: number) {
  return `course-data-${courseLegacyId}`;
}

/**
 * Tags of the story pages whose previous/next links point at `story`.
 *
 * Neighbours are the public stories sorting directly before and after it, so
 * when a story is published, unpublished, renamed, re-illustrated or moved,
 * only those two pages need a refresh - not the whole course. Call it before
 * a move (old neighbours) and after (new neighbours). Unlisted stories also
 * get neighbour links, but they are noindexed and fall back to the slow
 * cache refresh.
 */
export async function crossLinkNeighbourTags(
  ctx: MutationCtx,
  story: Doc<"stories">,
): Promise<string[]> {
  if (typeof story.legacyId !== "number") return [];
  const current = {
    id: story.legacyId,
    name: story.name,
    set_id: story.set_id ?? 0,
    set_index: story.set_index ?? 0,
  };
  let siblings: Awaited<ReturnType<typeof listNearbyPublicCourseStories>>;
  try {
    siblings = await listNearbyPublicCourseStories(
      ctx,
      story.courseId,
      current.set_id,
    );
  } catch {
    // Oversized story set: the cross-link query fails for these pages too, so
    // there is nothing precise to refresh. Never block the write on it.
    return [];
  }
  const { previous, next } = selectStoryCrossLinks(
    siblings.map((entry) => ({
      id: entry.legacyId,
      name: entry.story.name,
      set_id: entry.set_id,
      set_index: entry.set_index,
    })),
    current,
  );
  return [previous, next].flatMap((neighbour) =>
    neighbour ? [`story-${neighbour.id}`] : [],
  );
}
