export type CrossLinkCandidate = {
  id: number;
  name: string;
  set_id: number;
  set_index: number;
};

/** How many sibling stories the "More … stories" block lists. */
export const CROSS_LINK_MORE_COUNT = 4;

function compareBySet(a: CrossLinkCandidate, b: CrossLinkCandidate) {
  const setCmp = a.set_id - b.set_id;
  if (setCmp !== 0) return setCmp;
  const indexCmp = a.set_index - b.set_index;
  if (indexCmp !== 0) return indexCmp;
  return a.id - b.id;
}

/**
 * Picks the sibling stories a story page links to.
 *
 * `candidates` must already be filtered to publicly linkable stories of the
 * same course (see `listPublicCourseStories`); this function only decides
 * which of them to show. `current` may legitimately be absent from
 * `candidates` (an unpublished story still gets neighbours based on where it
 * would sort), which is why the position is derived from the set ordering
 * rather than from an index lookup.
 */
export function selectStoryCrossLinks(
  candidates: CrossLinkCandidate[],
  current: CrossLinkCandidate,
  moreCount: number = CROSS_LINK_MORE_COUNT,
) {
  const siblings = candidates
    .filter((candidate) => candidate.id !== current.id)
    .sort(compareBySet);

  const firstAfter = siblings.findIndex(
    (sibling) => compareBySet(sibling, current) > 0,
  );
  const nextIndex = firstAfter === -1 ? siblings.length : firstAfter;

  const previous = siblings[nextIndex - 1] ?? null;
  const next = siblings[nextIndex] ?? null;

  const alreadyLinked = new Set<number>();
  if (previous) alreadyLinked.add(previous.id);
  if (next) alreadyLinked.add(next.id);

  const more = siblings
    .map((story, index) => ({ story, index }))
    .filter(({ story }) => !alreadyLinked.has(story.id))
    // Prefer the current set, then whatever sits closest in reading order, so
    // the block stays topically related instead of jumping across the course.
    .sort((a, b) => {
      const sameSetA = a.story.set_id === current.set_id ? 0 : 1;
      const sameSetB = b.story.set_id === current.set_id ? 0 : 1;
      if (sameSetA !== sameSetB) return sameSetA - sameSetB;
      const distanceA = Math.abs(a.index - nextIndex);
      const distanceB = Math.abs(b.index - nextIndex);
      if (distanceA !== distanceB) return distanceA - distanceB;
      return a.index - b.index;
    })
    .slice(0, Math.max(0, moreCount))
    // Restore reading order for display.
    .sort((a, b) => a.index - b.index)
    .map(({ story }) => story);

  return { previous, next, more };
}
