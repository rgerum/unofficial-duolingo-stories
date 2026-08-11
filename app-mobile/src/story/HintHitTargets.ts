export type HintFragment = {
  tokenKey: string;
  x1: number;
  x2: number;
  y: number;
  height: number;
};

const MINIMUM_HINT_TARGET_SIZE = 44;

function distanceFromFragment(
  fragment: HintFragment,
  x: number,
  y: number,
): number {
  const dx = Math.max(fragment.x1 - x, 0, x - fragment.x2);
  const dy = Math.max(fragment.y - y, 0, y - (fragment.y + fragment.height));
  return dx * dx + dy * dy;
}

/**
 * Finds the closest hinted fragment whose virtual target is at least 44 dp.
 * Choosing by distance keeps neighboring short words deterministic when their
 * expanded targets overlap.
 */
export function findHintAtPoint(
  fragments: HintFragment[],
  x: number,
  y: number,
): HintFragment | undefined {
  let closest: HintFragment | undefined;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const fragment of fragments) {
    const horizontalInset = Math.max(
      0,
      (MINIMUM_HINT_TARGET_SIZE - (fragment.x2 - fragment.x1)) / 2,
    );
    const verticalInset = Math.max(
      0,
      (MINIMUM_HINT_TARGET_SIZE - fragment.height) / 2,
    );
    if (
      x < fragment.x1 - horizontalInset ||
      x > fragment.x2 + horizontalInset ||
      y < fragment.y - verticalInset ||
      y > fragment.y + fragment.height + verticalInset
    ) {
      continue;
    }

    const distance = distanceFromFragment(fragment, x, y);
    if (distance < closestDistance) {
      closest = fragment;
      closestDistance = distance;
    }
  }

  return closest;
}
