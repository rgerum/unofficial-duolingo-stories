export type TimingPart = { text: string; pos: number };
export type TimingRegion = { start: number };

/** Builds the ";chars,ms" timing string for aligned (part, region) pairs.
 *  Pairs beyond the shorter of the two arrays are ignored. */
export function buildTimingText(
  parts: readonly TimingPart[],
  regions: readonly TimingRegion[],
): string {
  const count = Math.min(parts.length, regions.length);
  let timingText = "";
  for (let index = 0; index < count; index += 1) {
    const part = parts[index]!;
    const previousPart = parts[index - 1];
    const previousEnd = previousPart
      ? previousPart.text.length + previousPart.pos
      : 0;
    const previousMs = regions[index - 1]
      ? Math.floor(regions[index - 1]!.start * 1000)
      : 0;
    timingText +=
      ";" +
      (part.text.length + part.pos - previousEnd) +
      "," +
      (Math.floor(regions[index]!.start * 1000) - previousMs);
  }
  return timingText;
}
