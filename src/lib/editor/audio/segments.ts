// Pure segment/time-range math extracted from the audio-cutter dialog.
// No DOM, React, or wavesurfer coupling — safe to unit test in isolation.

import { clamp } from "@/lib/editor/audio/format";

export type TimeRange = {
  start: number;
  end: number;
};

export type Segment = {
  id: string;
  start: number;
  end: number;
  label?: string;
  skipRanges: TimeRange[];
};

export type SegmentDraft = {
  start: number;
  end: number;
  skipRanges?: TimeRange[];
};

export type AudioSilenceAnalysis = {
  duration: number;
  levels: number[];
  startPaddingSeconds: number;
  endPaddingSeconds: number;
  threshold: number;
  windowSeconds: number;
  minSilenceWindows: number;
  minSpeechWindows: number;
  minSilenceSeconds: number;
};

export function sortSegments(segments: Segment[]) {
  return [...segments].sort((left, right) => left.start - right.start);
}

export function areTimeRangesEqual(left: TimeRange[], right: TimeRange[]) {
  if (left.length !== right.length) return false;
  return left.every((range, index) => {
    const other = right[index];
    return other && range.start === other.start && range.end === other.end;
  });
}

export function areSegmentsEqual(left: Segment[], right: Segment[]) {
  if (left.length !== right.length) return false;
  return left.every((segment, index) => {
    const other = right[index];
    return (
      other &&
      segment.id === other.id &&
      segment.start === other.start &&
      segment.end === other.end &&
      segment.label === other.label &&
      areTimeRangesEqual(segment.skipRanges, other.skipRanges)
    );
  });
}

export function createSegmentId() {
  return `segment-${Math.random().toString(36).slice(2, 10)}`;
}

export function sortRanges(ranges: TimeRange[]) {
  return [...ranges].sort((left, right) => left.start - right.start);
}

export function normalizeRanges(
  ranges: TimeRange[] | undefined,
  bounds: { start: number; end: number },
) {
  const normalized: TimeRange[] = [];

  for (const range of sortRanges(ranges ?? [])) {
    const start = clamp(range.start, bounds.start, bounds.end);
    const end = clamp(range.end, start, bounds.end);
    if (end - start <= 0.001) continue;

    const previous = normalized[normalized.length - 1];
    if (!previous || start > previous.end) {
      normalized.push({ start, end });
      continue;
    }

    previous.end = Math.max(previous.end, end);
  }

  return normalized;
}

export function getTotalRangeDuration(ranges: TimeRange[] | undefined) {
  return (ranges ?? []).reduce(
    (total, range) => total + Math.max(0, range.end - range.start),
    0,
  );
}

export function getKeepRangeEnd(
  bounds: TimeRange,
  skipRanges: TimeRange[] | undefined,
) {
  const keepRanges = getKeepRanges(bounds, skipRanges);
  return keepRanges[keepRanges.length - 1]?.end ?? bounds.end;
}

export function getEffectiveSegmentDuration(segment: {
  start: number;
  end: number;
  skipRanges?: TimeRange[];
}) {
  return Math.max(
    0,
    segment.end - segment.start - getTotalRangeDuration(segment.skipRanges),
  );
}

export function getKeepRanges(
  bounds: TimeRange,
  skipRanges: TimeRange[] | undefined,
) {
  const normalizedSkipRanges = normalizeRanges(skipRanges, bounds);
  if (normalizedSkipRanges.length === 0) return [bounds];

  const keepRanges: TimeRange[] = [];
  let cursor = bounds.start;

  for (const skipRange of normalizedSkipRanges) {
    if (skipRange.start > cursor) {
      keepRanges.push({
        start: cursor,
        end: skipRange.start,
      });
    }
    cursor = Math.max(cursor, skipRange.end);
  }

  if (cursor < bounds.end) {
    keepRanges.push({
      start: cursor,
      end: bounds.end,
    });
  }

  return keepRanges.filter((range) => range.end - range.start > 0.001);
}

export function mapPlayableOffsetToAbsoluteTime(
  keepRanges: TimeRange[],
  offsetSeconds: number,
) {
  if (keepRanges.length === 0) return 0;

  let remaining = Math.max(0, offsetSeconds);
  for (const range of keepRanges) {
    const rangeDuration = Math.max(0, range.end - range.start);
    if (remaining <= rangeDuration) {
      return range.start + remaining;
    }
    remaining -= rangeDuration;
  }

  return keepRanges[keepRanges.length - 1]?.end ?? 0;
}

export function clampTimeToKeepRanges(
  timeSeconds: number,
  keepRanges: TimeRange[],
) {
  if (keepRanges.length === 0) return timeSeconds;

  if (timeSeconds <= keepRanges[0]?.start) {
    return keepRanges[0]?.start ?? timeSeconds;
  }

  for (let index = 0; index < keepRanges.length; index += 1) {
    const range = keepRanges[index];
    if (!range) continue;
    if (timeSeconds >= range.start && timeSeconds <= range.end) {
      return timeSeconds;
    }

    const nextRange = keepRanges[index + 1];
    if (!nextRange || timeSeconds >= nextRange.start) continue;

    const previousDistance = Math.abs(timeSeconds - range.end);
    const nextDistance = Math.abs(nextRange.start - timeSeconds);
    return previousDistance <= nextDistance ? range.end : nextRange.start;
  }

  return keepRanges[keepRanges.length - 1]?.end ?? timeSeconds;
}

export function detectSpeechSegmentsFromAnalysis({
  duration,
  levels,
  minSilenceWindows,
  minSpeechWindows,
  startPaddingSeconds,
  endPaddingSeconds,
  threshold,
  windowSeconds,
}: AudioSilenceAnalysis) {
  if (!Number.isFinite(duration) || duration <= 0) return [];

  const segments: SegmentDraft[] = [];
  let speechStartWindow: number | null = null;
  let lastLoudWindow = -1;

  for (let windowIndex = 0; windowIndex < levels.length; windowIndex += 1) {
    const isLoud = (levels[windowIndex] ?? 0) >= threshold;

    if (isLoud) {
      if (speechStartWindow === null) {
        speechStartWindow = windowIndex;
      }
      lastLoudWindow = windowIndex;
      continue;
    }

    if (speechStartWindow === null) continue;
    const silentWindows = windowIndex - lastLoudWindow;
    if (silentWindows < minSilenceWindows) continue;

    if (lastLoudWindow - speechStartWindow + 1 >= minSpeechWindows) {
      segments.push({
        start: Math.max(
          0,
          speechStartWindow * windowSeconds - startPaddingSeconds,
        ),
        end: Math.min(
          duration,
          lastLoudWindow * windowSeconds + windowSeconds + endPaddingSeconds,
        ),
      });
    }

    speechStartWindow = null;
    lastLoudWindow = -1;
  }

  if (
    speechStartWindow !== null &&
    lastLoudWindow - speechStartWindow + 1 >= minSpeechWindows
  ) {
    segments.push({
      start: Math.max(
        0,
        speechStartWindow * windowSeconds - startPaddingSeconds,
      ),
      end: Math.min(
        duration,
        lastLoudWindow * windowSeconds + windowSeconds + endPaddingSeconds,
      ),
    });
  }

  return segments.reduce<SegmentDraft[]>((acc, segment) => {
    const previous = acc[acc.length - 1];
    if (!previous) {
      acc.push(segment);
      return acc;
    }

    if (segment.start - previous.end < minSilenceWindows * windowSeconds) {
      previous.end = Math.max(previous.end, segment.end);
      return acc;
    }

    acc.push(segment);
    return acc;
  }, []);
}

export function getSegmentSkipRangesFromAnalysis(
  analysis: AudioSilenceAnalysis,
  segment: TimeRange,
  maxInternalSilenceSeconds: number,
) {
  if (maxInternalSilenceSeconds <= 0) return [];

  const { levels, threshold, windowSeconds } = analysis;
  if (levels.length === 0) return [];

  const startWindow = clamp(
    Math.floor(segment.start / windowSeconds),
    0,
    levels.length - 1,
  );
  const endWindowExclusive = clamp(
    Math.ceil(segment.end / windowSeconds),
    startWindow + 1,
    levels.length,
  );

  let firstLoudWindow = -1;
  let lastLoudWindow = -1;
  for (let index = startWindow; index < endWindowExclusive; index += 1) {
    if ((levels[index] ?? 0) < threshold) continue;
    if (firstLoudWindow === -1) firstLoudWindow = index;
    lastLoudWindow = index;
  }

  if (firstLoudWindow === -1 || lastLoudWindow === -1) return [];

  const skipRanges: TimeRange[] = [];
  let silentRunStart = -1;

  for (let index = firstLoudWindow; index <= lastLoudWindow + 1; index += 1) {
    const isLoud = index <= lastLoudWindow && (levels[index] ?? 0) >= threshold;

    if (!isLoud) {
      if (silentRunStart === -1) {
        silentRunStart = index;
      }
      continue;
    }

    if (silentRunStart === -1) continue;

    const silentWindowCount = index - silentRunStart;
    const silentDuration = silentWindowCount * windowSeconds;
    if (silentDuration > maxInternalSilenceSeconds) {
      const rawSilenceStart = silentRunStart * windowSeconds;
      const rawSilenceEnd = index * windowSeconds;
      const skipStart = clamp(
        rawSilenceStart + maxInternalSilenceSeconds / 2,
        segment.start,
        segment.end,
      );
      const skipEnd = clamp(
        rawSilenceEnd - maxInternalSilenceSeconds / 2,
        skipStart,
        segment.end,
      );

      if (skipEnd - skipStart > 0.001) {
        skipRanges.push({
          start: skipStart,
          end: skipEnd,
        });
      }
    }

    silentRunStart = -1;
  }

  return normalizeRanges(skipRanges, segment);
}
