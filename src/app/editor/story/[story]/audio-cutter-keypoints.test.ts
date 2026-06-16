import assert from "node:assert/strict";
import test from "node:test";

import { getSegmentRelativeKeypointsFromWordMarks } from "./audio-cutter-keypoints";

test("getSegmentRelativeKeypointsFromWordMarks saves marks relative to the exported segment", () => {
  assert.deepEqual(
    getSegmentRelativeKeypointsFromWordMarks(
      {
        start: 132.7,
        end: 134.393,
      },
      [
        { type: "word", value: "Oh", start: 0, end: 2, time: 132768 },
        { type: "word", value: "nyd", start: 6, end: 9, time: 132895 },
        { type: "word", value: "din", start: 14, end: 17, time: 133085 },
        { type: "word", value: "date", start: 18, end: 22, time: 133276 },
      ],
    ),
    [
      { rangeEnd: 2, audioStart: 68 },
      { rangeEnd: 9, audioStart: 195 },
      { rangeEnd: 17, audioStart: 385 },
      { rangeEnd: 22, audioStart: 576 },
    ],
  );
});

test("getSegmentRelativeKeypointsFromWordMarks accounts for skipped ranges", () => {
  assert.deepEqual(
    getSegmentRelativeKeypointsFromWordMarks(
      {
        start: 10,
        end: 14,
        skipRanges: [{ start: 11, end: 12 }],
      },
      [
        { type: "word", value: "one", start: 0, end: 3, time: 10000 },
        { type: "word", value: "two", start: 4, end: 7, time: 10500 },
        { type: "word", value: "three", start: 8, end: 13, time: 12500 },
        { type: "word", value: "four", start: 14, end: 18, time: 14000 },
      ],
    ),
    [
      { rangeEnd: 3, audioStart: 0 },
      { rangeEnd: 7, audioStart: 500 },
      { rangeEnd: 13, audioStart: 1500 },
      { rangeEnd: 18, audioStart: 3000 },
    ],
  );
});
