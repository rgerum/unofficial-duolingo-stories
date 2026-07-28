export type CrossLinkCandidate = {
  id: number;
  name: string;
  set_id: number;
  set_index: number;
};

function compareBySet(a: CrossLinkCandidate, b: CrossLinkCandidate) {
  const setCmp = a.set_id - b.set_id;
  if (setCmp !== 0) return setCmp;
  const indexCmp = a.set_index - b.set_index;
  if (indexCmp !== 0) return indexCmp;
  return a.id - b.id;
}

/**
 * Picks the previous/next sibling a story page links to.
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

  return { previous, next };
}
