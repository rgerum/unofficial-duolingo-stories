import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTimingText,
  type TimingPart,
  type TimingRegion,
} from "@/lib/editor/audio/timing_text";

const parts: TimingPart[] = [
  { text: "ab", pos: 0 },
  { text: "cde", pos: 5 },
  { text: "f", pos: 9 },
  { text: "ghij", pos: 12 },
];
const regions: TimingRegion[] = [
  { start: 0.1 },
  { start: 0.5 },
  { start: 1.2 },
  { start: 2.0 },
];

test("buildTimingText matches the inline formula for equal-length inputs", () => {
  assert.equal(
    buildTimingText(parts.slice(0, 3), regions.slice(0, 3)),
    ";2,100;6,400;2,700",
  );
});

test("buildTimingText ignores surplus regions without throwing", () => {
  const twoParts = parts.slice(0, 2);
  assert.equal(
    buildTimingText(twoParts, regions),
    buildTimingText(twoParts, regions.slice(0, 2)),
  );
  assert.equal(buildTimingText(twoParts, regions), ";2,100;6,400");
});

test("buildTimingText ignores surplus parts without throwing", () => {
  const twoRegions = regions.slice(0, 2);
  assert.equal(
    buildTimingText(parts, twoRegions),
    buildTimingText(parts.slice(0, 2), twoRegions),
  );
  assert.equal(buildTimingText(parts, twoRegions), ";2,100;6,400");
});

test("buildTimingText returns empty string for empty inputs", () => {
  assert.equal(buildTimingText([], []), "");
});
