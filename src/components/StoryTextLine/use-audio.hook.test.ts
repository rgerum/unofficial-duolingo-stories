import assert from "node:assert/strict";
import test from "node:test";

import { getPlayableKeypoints } from "./use-audio.hook";

test("getPlayableKeypoints removes markers after the audio duration", () => {
  assert.deepEqual(
    getPlayableKeypoints(
      [
        { rangeEnd: 2, audioStart: 80 },
        { rangeEnd: 7, audioStart: 596 },
        { rangeEnd: 30, audioStart: 15312 },
      ],
      1.7,
    ),
    [
      { rangeEnd: 2, audioStart: 80 },
      { rangeEnd: 7, audioStart: 596 },
    ],
  );
});

test("getPlayableKeypoints preserves markers when duration is unavailable", () => {
  const keypoints = [
    { rangeEnd: 2, audioStart: 80 },
    { rangeEnd: 30, audioStart: 15312 },
  ];

  assert.deepEqual(getPlayableKeypoints(keypoints, Number.NaN), keypoints);
});
