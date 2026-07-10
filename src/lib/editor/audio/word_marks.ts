// Pure word-mark estimation extracted from the audio-cutter dialog.
// No DOM, React, or wavesurfer coupling — safe to unit test in isolation.

import type { AudioMark } from "@/app/audio/_lib/audio/types";
import {
  getGraphemeLength,
  getTranscriptWordTokens,
} from "@/app/editor/story/[story]/audio-cutter-text";
import { clamp } from "@/lib/editor/audio/format";
import {
  clampTimeToKeepRanges,
  getKeepRangeEnd,
  getKeepRanges,
  getTotalRangeDuration,
  mapPlayableOffsetToAbsoluteTime,
  type Segment,
} from "@/lib/editor/audio/segments";

export const MIN_WORD_MARK_GAP_MS = 20;

export function getApproximateWordMarks(
  text: string,
  segment: Segment,
): AudioMark[] {
  const tokens = getTranscriptWordTokens(text);
  if (tokens.length === 0) return [];

  const keepRanges = getKeepRanges(
    {
      start: segment.start,
      end: segment.end,
    },
    segment.skipRanges,
  );
  const totalKeepDuration = getTotalRangeDuration(keepRanges);
  if (keepRanges.length === 0 || totalKeepDuration <= 0) return [];

  const weights = tokens.map((token) =>
    Math.max(1, getGraphemeLength(token.text)),
  );
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) return [];

  let cumulativeWeight = 0;
  return tokens.map((token, index) => {
    const startOffsetSeconds =
      (totalKeepDuration * cumulativeWeight) / totalWeight;
    cumulativeWeight += weights[index] ?? 0;
    const startSeconds = mapPlayableOffsetToAbsoluteTime(
      keepRanges,
      startOffsetSeconds,
    );

    return {
      time: Math.round(startSeconds * 1000),
      type: "word",
      start: token.start,
      end: token.end,
      value: token.text,
    };
  });
}

export function getApproximateWordPlaybackRange(
  segment: Segment,
  marks: AudioMark[],
  markIndex: number,
) {
  const mark = marks[markIndex];
  if (!mark) return null;

  const startSeconds = mark.time / 1000;
  const nextMark = marks[markIndex + 1];
  const keepRangeEnd = getKeepRangeEnd(
    {
      start: segment.start,
      end: segment.end,
    },
    segment.skipRanges,
  );
  const endSeconds = Math.max(
    startSeconds + 0.06,
    nextMark ? nextMark.time / 1000 : keepRangeEnd,
  );

  return {
    startSeconds,
    endSeconds,
  };
}

export function applyWordMarkTimeOverrides(
  approximateMarks: AudioMark[],
  timeOverridesMs: number[] | undefined,
  segment: Segment,
) {
  if (approximateMarks.length === 0) return approximateMarks;

  const keepRanges = getKeepRanges(
    {
      start: segment.start,
      end: segment.end,
    },
    segment.skipRanges,
  );
  if (keepRanges.length === 0) return approximateMarks;

  const keepStartMs = Math.round(
    (keepRanges[0]?.start ?? segment.start) * 1000,
  );
  const keepEndMs = Math.round(
    getKeepRangeEnd(
      {
        start: segment.start,
        end: segment.end,
      },
      segment.skipRanges,
    ) * 1000,
  );

  return approximateMarks.map((mark, index) => {
    const previousTimeMs =
      index > 0
        ? (timeOverridesMs?.[index - 1] ??
          approximateMarks[index - 1]?.time ??
          keepStartMs)
        : keepStartMs;
    const nextTimeMs =
      timeOverridesMs?.[index + 1] ??
      approximateMarks[index + 1]?.time ??
      keepEndMs;
    const minTimeMs =
      index === 0 ? keepStartMs : previousTimeMs + MIN_WORD_MARK_GAP_MS;
    const maxTimeMs =
      index === approximateMarks.length - 1
        ? keepEndMs
        : nextTimeMs - MIN_WORD_MARK_GAP_MS;
    const boundedTimeMs = clamp(
      timeOverridesMs?.[index] ?? mark.time,
      minTimeMs,
      Math.max(minTimeMs, maxTimeMs),
    );
    const clampedTimeSeconds = clampTimeToKeepRanges(
      boundedTimeMs / 1000,
      keepRanges,
    );

    return {
      ...mark,
      time: Math.round(clampedTimeSeconds * 1000),
    };
  });
}

export function getActiveWordMarkIndex(
  segment: Segment,
  marks: AudioMark[],
  currentTimeSeconds: number,
) {
  if (marks.length === 0) return -1;
  if (currentTimeSeconds < segment.start || currentTimeSeconds > segment.end) {
    return -1;
  }

  const keepRangeEnd = getKeepRangeEnd(
    {
      start: segment.start,
      end: segment.end,
    },
    segment.skipRanges,
  );

  for (let index = 0; index < marks.length; index += 1) {
    const markStartSeconds = (marks[index]?.time ?? 0) / 1000;
    const nextMarkTime = marks[index + 1]?.time;
    const nextStartSeconds =
      nextMarkTime != null ? nextMarkTime / 1000 : keepRangeEnd;

    if (
      currentTimeSeconds >= markStartSeconds &&
      currentTimeSeconds < nextStartSeconds
    ) {
      return index;
    }
  }

  return currentTimeSeconds >= (marks[marks.length - 1]?.time ?? 0) / 1000
    ? marks.length - 1
    : -1;
}
