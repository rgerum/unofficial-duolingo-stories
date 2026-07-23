import assert from "node:assert/strict";
import test from "node:test";

import {
  areSegmentsEqual,
  type AudioSilenceAnalysis,
  clampTimeToKeepRanges,
  createSegmentId,
  detectSpeechSegmentsFromAnalysis,
  getEffectiveSegmentDuration,
  getKeepRangeEnd,
  getKeepRanges,
  getSegmentSkipRangesFromAnalysis,
  getTotalRangeDuration,
  mapPlayableOffsetToAbsoluteTime,
  moveRangeWithinBounds,
  normalizeRanges,
  resizeRangeWithinBounds,
  type Segment,
  sortSegments,
} from "@/lib/editor/audio/segments";

const bounds = { start: 0, end: 10 };

test("normalizeRanges merges overlapping ranges", () => {
  assert.deepEqual(
    normalizeRanges(
      [
        { start: 1, end: 3 },
        { start: 2, end: 5 },
      ],
      bounds,
    ),
    [{ start: 1, end: 5 }],
  );
});

test("normalizeRanges sorts unsorted input", () => {
  assert.deepEqual(
    normalizeRanges(
      [
        { start: 5, end: 7 },
        { start: 1, end: 2 },
      ],
      bounds,
    ),
    [
      { start: 1, end: 2 },
      { start: 5, end: 7 },
    ],
  );
});

test("normalizeRanges returns empty for empty/undefined input", () => {
  assert.deepEqual(normalizeRanges([], bounds), []);
  assert.deepEqual(normalizeRanges(undefined, bounds), []);
});

test("moveRangeWithinBounds preserves duration and clamps at both edges", () => {
  assert.deepEqual(moveRangeWithinBounds({ start: 3, end: 5 }, 2, bounds), {
    start: 5,
    end: 7,
  });
  assert.deepEqual(moveRangeWithinBounds({ start: 3, end: 5 }, -10, bounds), {
    start: 0,
    end: 2,
  });
  assert.deepEqual(moveRangeWithinBounds({ start: 3, end: 5 }, 10, bounds), {
    start: 8,
    end: 10,
  });
});

test("resizeRangeWithinBounds moves one edge and keeps a minimum duration", () => {
  assert.deepEqual(
    resizeRangeWithinBounds({ start: 3, end: 5 }, "start", -2, bounds),
    { start: 1, end: 5 },
  );
  assert.deepEqual(
    resizeRangeWithinBounds({ start: 3, end: 5 }, "end", 10, bounds),
    { start: 3, end: 10 },
  );
  assert.deepEqual(
    resizeRangeWithinBounds({ start: 3, end: 5 }, "start", 10, bounds, 0.5),
    { start: 4.5, end: 5 },
  );
});

test("getKeepRanges returns the whole bounds with no skips", () => {
  assert.deepEqual(getKeepRanges(bounds, []), [{ start: 0, end: 10 }]);
});

test("getKeepRanges splits around a skip in the middle", () => {
  assert.deepEqual(getKeepRanges(bounds, [{ start: 3, end: 5 }]), [
    { start: 0, end: 3 },
    { start: 5, end: 10 },
  ]);
});

test("getKeepRanges returns nothing when a skip covers the whole bounds", () => {
  assert.deepEqual(getKeepRanges(bounds, [{ start: 0, end: 10 }]), []);
});

test("clampTimeToKeepRanges leaves a time inside a keep range unchanged", () => {
  const keepRanges = getKeepRanges(bounds, [{ start: 3, end: 5 }]);
  assert.equal(clampTimeToKeepRanges(2, keepRanges), 2);
});

test("clampTimeToKeepRanges snaps a gap time to the nearest boundary", () => {
  const keepRanges = getKeepRanges(bounds, [{ start: 3, end: 5 }]);
  // Time 4 is equidistant; ties go to the earlier range end.
  assert.equal(clampTimeToKeepRanges(4, keepRanges), 3);
});

test("clampTimeToKeepRanges snaps a time before the first range to its start", () => {
  const keepRanges = getKeepRanges(bounds, [{ start: 3, end: 5 }]);
  assert.equal(clampTimeToKeepRanges(-2, keepRanges), 0);
});

test("clampTimeToKeepRanges snaps a time after the last range to its end", () => {
  const keepRanges = getKeepRanges(bounds, [{ start: 3, end: 5 }]);
  assert.equal(clampTimeToKeepRanges(20, keepRanges), 10);
});

test("mapPlayableOffsetToAbsoluteTime skips over a gap", () => {
  const keepRanges = getKeepRanges(bounds, [{ start: 3, end: 5 }]);
  // Offset 4 of playable time lands 1s into the second range (starts at 5).
  assert.equal(mapPlayableOffsetToAbsoluteTime(keepRanges, 4), 6);
});

test("mapPlayableOffsetToAbsoluteTime returns 0 for empty ranges", () => {
  assert.equal(mapPlayableOffsetToAbsoluteTime([], 5), 0);
});

test("getTotalRangeDuration sums range lengths", () => {
  assert.equal(
    getTotalRangeDuration([
      { start: 0, end: 3 },
      { start: 5, end: 10 },
    ]),
    8,
  );
});

test("getTotalRangeDuration returns 0 for empty/undefined", () => {
  assert.equal(getTotalRangeDuration([]), 0);
  assert.equal(getTotalRangeDuration(undefined), 0);
});

test("getEffectiveSegmentDuration subtracts skip ranges", () => {
  assert.equal(
    getEffectiveSegmentDuration({
      start: 0,
      end: 10,
      skipRanges: [{ start: 3, end: 5 }],
    }),
    8,
  );
});

test("getKeepRangeEnd returns the last keep-range end", () => {
  assert.equal(getKeepRangeEnd(bounds, [{ start: 8, end: 10 }]), 8);
});

test("sortSegments orders by start ascending without mutating input", () => {
  const input: Segment[] = [
    { id: "b", start: 5, end: 6, skipRanges: [] },
    { id: "a", start: 1, end: 2, skipRanges: [] },
  ];
  const sorted = sortSegments(input);
  assert.deepEqual(
    sorted.map((s) => s.id),
    ["a", "b"],
  );
  assert.equal(input[0]?.id, "b");
});

test("areSegmentsEqual compares ids, times, labels and skip ranges", () => {
  const left: Segment[] = [
    { id: "a", start: 0, end: 1, label: "x", skipRanges: [] },
  ];
  const same: Segment[] = [
    { id: "a", start: 0, end: 1, label: "x", skipRanges: [] },
  ];
  const different: Segment[] = [
    { id: "a", start: 0, end: 2, label: "x", skipRanges: [] },
  ];
  assert.equal(areSegmentsEqual(left, same), true);
  assert.equal(areSegmentsEqual(left, different), false);
});

test("createSegmentId produces a prefixed id", () => {
  assert.match(createSegmentId(), /^segment-[0-9a-z]+$/);
});

function makeAnalysis(
  levels: number[],
  overrides: Partial<AudioSilenceAnalysis> = {},
): AudioSilenceAnalysis {
  return {
    duration: levels.length,
    levels,
    startPaddingSeconds: 0,
    endPaddingSeconds: 0,
    threshold: 0.5,
    windowSeconds: 1,
    minSilenceWindows: 2,
    minSpeechWindows: 2,
    minSilenceSeconds: 2,
    ...overrides,
  };
}

test("detectSpeechSegmentsFromAnalysis splits loud runs separated by silence", () => {
  const segments = detectSpeechSegmentsFromAnalysis(
    makeAnalysis([1, 1, 0, 0, 0, 1, 1], { duration: 10 }),
  );
  assert.deepEqual(segments, [
    { start: 0, end: 2 },
    { start: 5, end: 7 },
  ]);
});

test("detectSpeechSegmentsFromAnalysis returns nothing for zero duration", () => {
  assert.deepEqual(
    detectSpeechSegmentsFromAnalysis(makeAnalysis([1, 1], { duration: 0 })),
    [],
  );
});

test("getSegmentSkipRangesFromAnalysis finds a long internal silence", () => {
  const analysis = makeAnalysis([1, 1, 0, 0, 0, 0, 1, 1]);
  assert.deepEqual(
    getSegmentSkipRangesFromAnalysis(analysis, { start: 0, end: 8 }, 2),
    [{ start: 3, end: 5 }],
  );
});

test("getSegmentSkipRangesFromAnalysis returns nothing when disabled", () => {
  const analysis = makeAnalysis([1, 1, 0, 0, 0, 0, 1, 1]);
  assert.deepEqual(
    getSegmentSkipRangesFromAnalysis(analysis, { start: 0, end: 8 }, 0),
    [],
  );
});
