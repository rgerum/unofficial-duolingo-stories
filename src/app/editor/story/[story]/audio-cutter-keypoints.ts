import type { AudioMark } from "@/app/audio/_lib/audio/types";

export type AudioCutterSegmentTiming = {
  start: number;
  end: number;
  skipRanges?: { start: number; end: number }[];
};

function sortRanges(ranges: { start: number; end: number }[]) {
  return [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRanges(
  ranges: { start: number; end: number }[] | undefined,
  bounds: { start: number; end: number },
) {
  const normalized: { start: number; end: number }[] = [];

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

function getKeepRanges(
  bounds: { start: number; end: number },
  skipRanges: { start: number; end: number }[] | undefined,
) {
  const normalizedSkipRanges = normalizeRanges(skipRanges, bounds);
  if (normalizedSkipRanges.length === 0) return [bounds];

  const keepRanges: { start: number; end: number }[] = [];
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

function clampTimeToKeepRanges(
  timeSeconds: number,
  keepRanges: { start: number; end: number }[],
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

function mapAbsoluteTimeToPlayableOffset(
  keepRanges: { start: number; end: number }[],
  absoluteTimeSeconds: number,
) {
  const clampedTimeSeconds = clampTimeToKeepRanges(
    absoluteTimeSeconds,
    keepRanges,
  );
  let offsetSeconds = 0;

  for (const range of keepRanges) {
    const rangeDuration = Math.max(0, range.end - range.start);
    if (clampedTimeSeconds <= range.end) {
      return offsetSeconds + Math.max(0, clampedTimeSeconds - range.start);
    }
    offsetSeconds += rangeDuration;
  }

  return offsetSeconds;
}

export function getSegmentRelativeKeypointsFromWordMarks(
  segment: AudioCutterSegmentTiming,
  marks: AudioMark[],
) {
  const keepRanges = getKeepRanges(
    {
      start: segment.start,
      end: segment.end,
    },
    segment.skipRanges,
  );

  return marks
    .map((mark) => ({
      rangeEnd: mark.end,
      audioStart: Math.round(
        mapAbsoluteTimeToPlayableOffset(keepRanges, mark.time / 1000) * 1000,
      ),
    }))
    .filter(
      (point, index, points) =>
        Number.isFinite(point.rangeEnd) &&
        Number.isFinite(point.audioStart) &&
        point.rangeEnd > 0 &&
        point.audioStart >= 0 &&
        (index === 0 ||
          point.rangeEnd !== points[index - 1]?.rangeEnd ||
          point.audioStart !== points[index - 1]?.audioStart),
    );
}
