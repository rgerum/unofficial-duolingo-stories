import assert from "node:assert/strict";
import test from "node:test";

import {
  text_to_keypoints,
  timings_to_text,
} from "@/lib/editor/audio/audio_timing";
import {
  buildTimingText,
  serializeTimingKeypoints,
  serializeTimingKeypointsUnchecked,
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

test("buildTimingText reports non-finite region starts", () => {
  assert.throws(
    () => buildTimingText([{ text: "word", pos: 0 }], [{ start: Number.NaN }]),
    {
      name: "RangeError",
      message: "Invalid audio keypoint at index 0: rangeEnd=4, audioStart=NaN",
    },
  );
});

// Regression: a stored negative delta ("$.../b1d5e3c7.mp3;1,50;-1,975;...")
// crashed the editor because timings_to_text throws during render.
const corruptLine = "$9783/b1d5e3c7.mp3;1,50;-1,975;0,800;0,225;0,575";

test("serializeTimingKeypoints rejects non-monotonic keypoints", () => {
  const [filename, keypoints] = text_to_keypoints(corruptLine.slice(1));
  assert.equal(filename, "9783/b1d5e3c7.mp3");
  assert.throws(
    () => timings_to_text({ filename, keypoints }),
    /Non-monotonic audio keypoint/,
  );
});

test("serializeTimingKeypointsUnchecked round-trips corrupt timings", () => {
  const [, keypoints] = text_to_keypoints(corruptLine.slice(1));
  assert.equal(
    serializeTimingKeypointsUnchecked(keypoints),
    ";1,50;-1,975;0,800;0,225;0,575",
  );
});

test("serializers agree on valid timings", () => {
  const [, keypoints] = text_to_keypoints("file.mp3;5,100;3,200;4,50");
  assert.equal(
    serializeTimingKeypointsUnchecked(keypoints),
    serializeTimingKeypoints(keypoints),
  );
});
