export type TimingPart = { text: string; pos: number };
export type TimingRegion = { start: number };
export type TimingKeypoint = { rangeEnd: number; audioStart: number };

export function serializeTimingKeypoints(
  keypoints: readonly TimingKeypoint[],
): string {
  let text = "";
  let lastEnd = 0;
  let lastTime = 0;
  for (const [index, point] of keypoints.entries()) {
    if (
      !Number.isFinite(point.rangeEnd) ||
      !Number.isFinite(point.audioStart)
    ) {
      throw new RangeError(
        `Invalid audio keypoint at index ${index}: rangeEnd=${point.rangeEnd}, audioStart=${point.audioStart}`,
      );
    }
    if (point.rangeEnd < lastEnd || point.audioStart < lastTime) {
      throw new RangeError(
        `Non-monotonic audio keypoint at index ${index}: rangeEnd=${point.rangeEnd} after ${lastEnd}, audioStart=${point.audioStart} after ${lastTime}`,
      );
    }
    text += `;${Math.round(point.rangeEnd - lastEnd)},${Math.round(point.audioStart - lastTime)}`;
    lastEnd = point.rangeEnd;
    lastTime = point.audioStart;
  }
  return text;
}

/** Builds the ";chars,ms" timing string for aligned (part, region) pairs.
 *  Pairs beyond the shorter of the two arrays are ignored. */
export function buildTimingText(
  parts: readonly TimingPart[],
  regions: readonly TimingRegion[],
): string {
  const count = Math.min(parts.length, regions.length);
  const keypoints: TimingKeypoint[] = [];
  for (let index = 0; index < count; index += 1) {
    const part = parts[index]!;
    keypoints.push({
      rangeEnd: part.text.length + part.pos,
      audioStart: Math.floor(regions[index]!.start * 1000),
    });
  }
  return serializeTimingKeypoints(keypoints);
}
