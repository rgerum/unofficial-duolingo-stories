"use client";

import React from "react";
import { zipSync } from "fflate";
import { useWavesurfer } from "@wavesurfer/react";
import {
  DownloadIcon,
  ScissorsIcon,
  Trash2Icon,
  UploadIcon,
  WandSparklesIcon,
} from "lucide-react";
import Regions from "wavesurfer.js/dist/plugins/regions.js";
import PlayAudio from "@/components/PlayAudio";
import Input from "@/components/ui/input";
import {
  decodeAudioData,
  normalizeAudioBufferPeak,
} from "@/lib/audio/client-audio-processing";
import { getLamejsModule } from "@/lib/lamejs-compat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AudioMark } from "@/app/audio/_lib/audio/types";
import type {
  AudioCutterPreparedSegment,
  AudioCutterTranscriptItem,
} from "@/app/editor/story/[story]/audio-cutter-storage";

const DEFAULT_WAVEFORM_ZOOM = 180;
const MIN_WAVEFORM_ZOOM = 24;
const MAX_WAVEFORM_ZOOM = 420;
const WAVEFORM_ZOOM_STEP = 24;
const DEFAULT_SEGMENT_LENGTH_SECONDS = 1.8;
const MIN_SEGMENT_LENGTH_SECONDS = 0.25;
const MIN_PERSISTED_NEW_SEGMENT_SECONDS = 0.1;
const WAVEFORM_TO_TRANSCRIPT_SYNC_LOCK_MS = 700;
const SILENCE_WINDOW_SECONDS = 0.02;
const DEFAULT_DETECTION_MIN_SILENCE_SECONDS = 1;
const DEFAULT_DETECTION_START_BUFFER_SECONDS = 0.04;
const DEFAULT_DETECTION_END_BUFFER_SECONDS = 0.04;
const DEFAULT_MAX_INTERNAL_SILENCE_SECONDS = 0.3;
const DETECTION_SETTINGS_STORAGE_KEY = "audio-cutter-detection-settings-v1";
const SHRINK_WRAP_STABILITY_EPSILON_SECONDS = 0.01;
const MP3_BITRATE_KBPS = 128;
const MP3_SAMPLE_BLOCK_SIZE = 1152;
const MIN_WORD_MARK_GAP_MS = 20;
const SEGMENT_COLOR = "rgba(28,176,246,0.2)";
const SEGMENT_BORDER_COLOR = "rgba(15,95,131,0.4)";
const SEGMENT_ACTIVE_BORDER_COLOR = "rgba(28,176,246,0.95)";
const cachedAudioSegmentation = new WeakMap<
  AudioBuffer,
  Map<string, CachedAudioSegmentation>
>();

type TimeRange = {
  start: number;
  end: number;
};

type Segment = {
  id: string;
  start: number;
  end: number;
  label?: string;
  skipRanges: TimeRange[];
};

type MergePreview = {
  activeId: string;
  targetId: string;
};

type SegmentDraft = {
  start: number;
  end: number;
  skipRanges?: TimeRange[];
};

type AudioSilenceAnalysis = {
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

type CachedAudioSegmentation = {
  analysis: AudioSilenceAnalysis;
  detectedSegments: SegmentDraft[];
};

type DetectionSettings = {
  minSilenceSeconds: number;
  startBufferSeconds: number;
  endBufferSeconds: number;
  maxInternalSilenceSeconds: number;
};

type SegmentRegion = {
  id: string;
  start: number;
  end: number;
  element?: HTMLElement | null;
  content?: HTMLElement | null;
  setOptions: (options: {
    start?: number;
    end?: number;
    color?: string;
    content?: string | HTMLElement;
    drag?: boolean;
    resize?: boolean;
    minLength?: number;
  }) => void;
  remove: () => void;
};

type RegionsPlugin = {
  addRegion: (options: {
    id?: string;
    start: number;
    end: number;
    color: string;
    content?: string | HTMLElement;
    drag?: boolean;
    resize?: boolean;
    minLength?: number;
  }) => SegmentRegion;
  clearRegions: () => void;
  enableDragSelection: (
    options: {
      color: string;
      drag?: boolean;
      resize?: boolean;
      minLength?: number;
    },
    threshold?: number,
  ) => () => void;
  getRegions: () => SegmentRegion[];
  on: (event: string, callback: (region: SegmentRegion) => void) => void;
  un: (event: string, callback: (region: SegmentRegion) => void) => void;
};

type SegmentedPlaybackState = {
  currentRangeIndex: number;
  didReachRangeEnd: boolean;
  keepRanges: TimeRange[];
};

const EMPTY_REGIONS_PLUGIN: RegionsPlugin = {
  addRegion: () => ({
    id: "",
    start: 0,
    end: 0,
    setOptions: () => {},
    remove: () => {},
  }),
  clearRegions: () => {},
  enableDragSelection: () => () => {},
  getRegions: () => [],
  on: () => {},
  un: () => {},
};

function sortSegments(segments: Segment[]) {
  return [...segments].sort((left, right) => left.start - right.start);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatSeconds(value: number) {
  const totalMs = Math.max(0, Math.round(value * 1000));
  const minutes = Math.floor(totalMs / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);
  const milliseconds = totalMs % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function getFileBaseName(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function waitForNextAnimationFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function createSegmentId() {
  return `segment-${Math.random().toString(36).slice(2, 10)}`;
}

function getWaveformScrollElement(
  wavesurfer: ReturnType<typeof useWavesurfer>["wavesurfer"],
) {
  if (!wavesurfer) return null;

  const wrapper = (
    wavesurfer as unknown as {
      getWrapper?: () => HTMLElement;
    }
  ).getWrapper?.();

  if (!wrapper) return null;
  return wrapper.parentElement;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    Boolean(target.closest("[contenteditable='true']"))
  );
}

function renderTextWithHighlightedWord(
  text: string,
  marks: AudioMark[],
  activeWordIndex: number,
  onPlayWord?: (markIndex: number) => void,
) {
  if (marks.length === 0) return text;

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  marks.forEach((mark, index) => {
    if (mark.start > cursor) {
      parts.push(text.slice(cursor, mark.start));
    }

    parts.push(
      <button
        key={`${mark.start}-${mark.end}-${index}`}
        type="button"
        className={
          index === activeWordIndex
            ? "rounded-[8px] bg-[#0f5f83] px-1 py-0.5 font-semibold text-white ring-2 ring-[#d7e34f] shadow-[0_1px_0_rgba(255,255,255,0.2)]"
            : "rounded-[8px] px-1 py-0.5 transition-colors hover:bg-[rgba(28,176,246,0.12)]"
        }
        onClick={(event) => {
          event.stopPropagation();
          onPlayWord?.(index);
        }}
      >
        {text.slice(mark.start, mark.end)}
      </button>,
    );
    cursor = mark.end;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

function getSegmentsFromPlugin(plugin: RegionsPlugin) {
  return sortSegments(
    plugin.getRegions().map((region) => ({
      id: region.id,
      start: region.start,
      end: region.end,
      skipRanges: [],
    })),
  );
}

function getOverlappingRegion(
  plugin: RegionsPlugin,
  activeRegion: SegmentRegion,
): SegmentRegion | null {
  let bestMatch: SegmentRegion | null = null;
  let bestOverlap = 0;

  for (const candidate of plugin.getRegions()) {
    if (candidate.id === activeRegion.id) continue;
    const overlap =
      Math.min(activeRegion.end, candidate.end) -
      Math.max(activeRegion.start, candidate.start);
    if (overlap <= 0) continue;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

function overlapsSegment(
  segment: { start: number; end: number },
  range: { start: number; end: number },
) {
  return (
    Math.min(segment.end, range.end) - Math.max(segment.start, range.start) > 0
  );
}

function sortRanges(ranges: TimeRange[]) {
  return [...ranges].sort((left, right) => left.start - right.start);
}

function normalizeRanges(
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

function getTotalRangeDuration(ranges: TimeRange[] | undefined) {
  return (ranges ?? []).reduce(
    (total, range) => total + Math.max(0, range.end - range.start),
    0,
  );
}

function getKeepRangeEnd(
  bounds: TimeRange,
  skipRanges: TimeRange[] | undefined,
) {
  const keepRanges = getKeepRanges(bounds, skipRanges);
  return keepRanges[keepRanges.length - 1]?.end ?? bounds.end;
}

function getEffectiveSegmentDuration(segment: {
  start: number;
  end: number;
  skipRanges?: TimeRange[];
}) {
  return Math.max(
    0,
    segment.end - segment.start - getTotalRangeDuration(segment.skipRanges),
  );
}

function getKeepRanges(bounds: TimeRange, skipRanges: TimeRange[] | undefined) {
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

function mapPlayableOffsetToAbsoluteTime(
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

function clampTimeToKeepRanges(timeSeconds: number, keepRanges: TimeRange[]) {
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

function getTranscriptWordTokens(text: string) {
  return [...text.matchAll(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)].map(
    (match) => ({
      text: match[0],
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    }),
  );
}

function getApproximateWordMarks(text: string, segment: Segment): AudioMark[] {
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
    Math.max(1, Array.from(token.text).length),
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

function getApproximateWordPlaybackRange(
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

function applyWordMarkTimeOverrides(
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

function getActiveWordMarkIndex(
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

function getKeypointsFromWordMarks(marks: AudioMark[]) {
  return marks
    .map((mark) => ({
      rangeEnd: mark.end,
      audioStart: mark.time,
    }))
    .filter(
      (point, index, points) =>
        Number.isFinite(point.rangeEnd) &&
        Number.isFinite(point.audioStart) &&
        point.rangeEnd > 0 &&
        (index === 0 ||
          point.rangeEnd !== points[index - 1]?.rangeEnd ||
          point.audioStart !== points[index - 1]?.audioStart),
    );
}

function sanitizeDetectionSettings(
  settings: Partial<DetectionSettings> | undefined,
): DetectionSettings {
  return {
    minSilenceSeconds: clamp(
      settings?.minSilenceSeconds ?? DEFAULT_DETECTION_MIN_SILENCE_SECONDS,
      0.1,
      5,
    ),
    startBufferSeconds: clamp(
      settings?.startBufferSeconds ?? DEFAULT_DETECTION_START_BUFFER_SECONDS,
      0,
      2,
    ),
    endBufferSeconds: clamp(
      settings?.endBufferSeconds ?? DEFAULT_DETECTION_END_BUFFER_SECONDS,
      0,
      2,
    ),
    maxInternalSilenceSeconds: clamp(
      settings?.maxInternalSilenceSeconds ??
        DEFAULT_MAX_INTERNAL_SILENCE_SECONDS,
      0,
      3,
    ),
  };
}

function getDetectionSettingsCacheKey(settings: DetectionSettings) {
  return [
    settings.minSilenceSeconds.toFixed(3),
    settings.startBufferSeconds.toFixed(3),
    settings.endBufferSeconds.toFixed(3),
    settings.maxInternalSilenceSeconds.toFixed(3),
  ].join(":");
}

function loadPersistedDetectionSettings() {
  try {
    const rawSettings = window.localStorage.getItem(
      DETECTION_SETTINGS_STORAGE_KEY,
    );
    if (!rawSettings) return null;
    return sanitizeDetectionSettings(
      JSON.parse(rawSettings) as Partial<DetectionSettings>,
    );
  } catch {
    return null;
  }
}

function analyzeAudioSilence(
  buffer: AudioBuffer,
  settings: DetectionSettings,
): AudioSilenceAnalysis {
  const sampleRate = buffer.sampleRate;
  const channelCount = buffer.numberOfChannels;
  const duration = buffer.duration;
  const windowSeconds = SILENCE_WINDOW_SECONDS;
  const windowSize = Math.max(128, Math.round(sampleRate * windowSeconds));
  const windowCount = Math.max(1, Math.ceil(buffer.length / windowSize));
  const levels: number[] = [];

  for (let windowIndex = 0; windowIndex < windowCount; windowIndex += 1) {
    const startSample = windowIndex * windowSize;
    const endSample = Math.min(buffer.length, startSample + windowSize);
    let peak = 0;

    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const channelData = buffer.getChannelData(channelIndex);
      for (
        let sampleIndex = startSample;
        sampleIndex < endSample;
        sampleIndex += 1
      ) {
        peak = Math.max(peak, Math.abs(channelData[sampleIndex] ?? 0));
      }
    }

    levels.push(peak);
  }

  const sortedLevels = [...levels].sort((left, right) => left - right);
  const peakLevel = sortedLevels[sortedLevels.length - 1] ?? 0;
  const floorLevel = sortedLevels[Math.floor(sortedLevels.length * 0.2)] ?? 0;

  return {
    duration,
    levels,
    startPaddingSeconds: settings.startBufferSeconds,
    endPaddingSeconds: settings.endBufferSeconds,
    threshold: clamp(
      Math.max(floorLevel * 3, peakLevel * 0.045, 0.008),
      0.008,
      Math.max(0.015, peakLevel * 0.5),
    ),
    windowSeconds,
    minSilenceWindows: Math.max(
      2,
      Math.round(settings.minSilenceSeconds / windowSeconds),
    ),
    minSpeechWindows: Math.max(2, Math.round(0.18 / windowSeconds)),
    minSilenceSeconds: settings.minSilenceSeconds,
  };
}

function detectSpeechSegmentsFromAnalysis({
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

function getSegmentSkipRangesFromAnalysis(
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

function getCachedAudioSegmentation(
  buffer: AudioBuffer,
  settings: DetectionSettings,
) {
  let cachedBySettings = cachedAudioSegmentation.get(buffer);
  if (!cachedBySettings) {
    cachedBySettings = new Map<string, CachedAudioSegmentation>();
    cachedAudioSegmentation.set(buffer, cachedBySettings);
  }

  const cacheKey = getDetectionSettingsCacheKey(settings);
  const cached = cachedBySettings.get(cacheKey);
  if (cached) return cached;

  const analysis = analyzeAudioSilence(buffer, settings);
  const next = {
    analysis,
    detectedSegments: detectSpeechSegmentsFromAnalysis(analysis),
  };
  cachedBySettings.set(cacheKey, next);
  return next;
}

function getShrinkWrappedSegment(
  buffer: AudioBuffer,
  segment: { start: number; end: number },
  settings: DetectionSettings,
) {
  const duration = segment.end - segment.start;
  if (duration <= MIN_SEGMENT_LENGTH_SECONDS) {
    return segment;
  }

  const { analysis, detectedSegments } = getCachedAudioSegmentation(
    buffer,
    settings,
  );
  const matchingDetectedSegment = detectedSegments.find(
    (candidate) =>
      Math.abs(candidate.start - segment.start) <=
        SHRINK_WRAP_STABILITY_EPSILON_SECONDS &&
      Math.abs(candidate.end - segment.end) <=
        SHRINK_WRAP_STABILITY_EPSILON_SECONDS,
  );
  if (matchingDetectedSegment) {
    return segment;
  }

  const {
    levels,
    startPaddingSeconds,
    endPaddingSeconds,
    threshold,
    windowSeconds,
  } = analysis;
  if (levels.length === 0) return segment;

  const startWindow = clamp(
    Math.floor(segment.start / windowSeconds),
    0,
    levels.length - 1,
  );
  const endWindow = clamp(
    Math.ceil(segment.end / windowSeconds),
    startWindow + 1,
    levels.length,
  );

  let firstActiveWindow = -1;
  let lastActiveWindow = -1;
  for (let index = startWindow; index < endWindow; index += 1) {
    if ((levels[index] ?? 0) < threshold) continue;
    if (firstActiveWindow === -1) firstActiveWindow = index;
    lastActiveWindow = index;
  }

  if (firstActiveWindow === -1 || lastActiveWindow === -1) {
    return segment;
  }

  const rawNextStart = Math.max(
    segment.start,
    firstActiveWindow * windowSeconds - startPaddingSeconds,
  );
  const rawNextEnd = Math.min(
    segment.end,
    (lastActiveWindow + 1) * windowSeconds + endPaddingSeconds,
  );
  const nextStart =
    Math.abs(rawNextStart - segment.start) <=
    SHRINK_WRAP_STABILITY_EPSILON_SECONDS
      ? segment.start
      : rawNextStart;
  const nextEnd =
    Math.abs(rawNextEnd - segment.end) <= SHRINK_WRAP_STABILITY_EPSILON_SECONDS
      ? segment.end
      : rawNextEnd;

  if (nextEnd - nextStart < MIN_SEGMENT_LENGTH_SECONDS) {
    return segment;
  }

  return {
    start: nextStart,
    end: nextEnd,
  };
}

function syncRegionSkipMarkers(regionElement: HTMLElement, segment: Segment) {
  const existingLayer = regionElement.querySelector<HTMLElement>(
    ".audio-cutter-region-skip-layer",
  );
  existingLayer?.remove();

  if (segment.skipRanges.length === 0) return;

  const segmentDuration = Math.max(segment.end - segment.start, 0.001);
  const skipLayer = document.createElement("div");
  skipLayer.className = "audio-cutter-region-skip-layer";
  skipLayer.style.position = "absolute";
  skipLayer.style.inset = "0";
  skipLayer.style.pointerEvents = "none";
  skipLayer.style.overflow = "hidden";
  skipLayer.style.borderRadius = "inherit";
  skipLayer.style.zIndex = "0";

  for (const skipRange of segment.skipRanges) {
    const marker = document.createElement("div");
    const leftPercent =
      ((skipRange.start - segment.start) / segmentDuration) * 100;
    const widthPercent =
      ((skipRange.end - skipRange.start) / segmentDuration) * 100;

    marker.style.position = "absolute";
    marker.style.left = `${leftPercent}%`;
    marker.style.top = "0";
    marker.style.bottom = "0";
    marker.style.width = `${widthPercent}%`;
    marker.style.background =
      "repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 6px, rgba(15,95,131,0.28) 6px 12px)";
    marker.style.borderLeft = "1px dashed rgba(15,95,131,0.75)";
    marker.style.borderRight = "1px dashed rgba(15,95,131,0.75)";
    skipLayer.append(marker);
  }

  const existingOverflow = regionElement.style.overflow;
  const computedOverflow = getComputedStyle(regionElement).overflow;
  if (!existingOverflow || computedOverflow === "visible") {
    regionElement.style.overflow = "hidden";
  }
  regionElement.append(skipLayer);
}

function syncRegionWordMarkers(
  regionElement: HTMLElement,
  segment: Segment,
  wordMarks: AudioMark[],
  activeWordIndex: number,
) {
  const existingLayer = regionElement.querySelector<HTMLElement>(
    ".audio-cutter-region-word-layer",
  );
  existingLayer?.remove();

  if (wordMarks.length === 0) return;

  const segmentDuration = Math.max(segment.end - segment.start, 0.001);
  const wordLayer = document.createElement("div");
  wordLayer.className = "audio-cutter-region-word-layer";
  wordLayer.style.position = "absolute";
  wordLayer.style.inset = "0";
  wordLayer.style.pointerEvents = "none";
  wordLayer.style.overflow = "hidden";
  wordLayer.style.borderRadius = "inherit";
  wordLayer.style.zIndex = "0";

  wordMarks.forEach((mark, markIndex) => {
    const marker = document.createElement("div");
    const leftPercent =
      ((mark.time / 1000 - segment.start) / segmentDuration) * 100;

    marker.style.position = "absolute";
    marker.style.left = `${leftPercent}%`;
    marker.style.top = markIndex === activeWordIndex ? "8%" : "14%";
    marker.style.bottom = markIndex === activeWordIndex ? "8%" : "14%";
    marker.style.width = markIndex === activeWordIndex ? "2px" : "1px";
    marker.style.background =
      markIndex === activeWordIndex
        ? "rgba(215,227,79,0.95)"
        : "rgba(15,95,131,0.38)";
    marker.style.boxShadow =
      markIndex === activeWordIndex
        ? "0 0 0 1px rgba(70,81,0,0.28)"
        : "0 0 0 1px rgba(255,255,255,0.18)";
    wordLayer.append(marker);
  });

  const existingOverflow = regionElement.style.overflow;
  const computedOverflow = getComputedStyle(regionElement).overflow;
  if (!existingOverflow || computedOverflow === "visible") {
    regionElement.style.overflow = "hidden";
  }
  regionElement.append(wordLayer);
}

function createIconSvg(path: string) {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "13");
  svg.setAttribute("height", "13");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const pathElement = document.createElementNS(namespace, "path");
  pathElement.setAttribute("d", path);
  svg.append(pathElement);

  return svg;
}

function createIconButton({
  title,
  iconPath,
  danger = false,
  onClick,
}: {
  title: string;
  iconPath: string;
  danger?: boolean;
  onClick: () => void;
}) {
  const button = document.createElement("button");
  button.type = "button";
  button.title = title;
  button.setAttribute("aria-label", title);
  button.className = danger
    ? "audio-cutter-region-icon-button audio-cutter-region-icon-button--danger"
    : "audio-cutter-region-icon-button";

  const stop = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  button.addEventListener("pointerdown", stop);
  button.addEventListener("mousedown", stop);
  button.addEventListener("click", (event) => {
    stop(event);
    onClick();
  });
  button.append(createIconSvg(iconPath));

  return button;
}

function createRegionContent({
  index,
  label,
  showControls,
  showJoinHint,
  onPlay,
  onShrinkWrap,
  onDelete,
  onEditLabel,
}: {
  index: number;
  label: string;
  showControls: boolean;
  showJoinHint: boolean;
  onPlay: () => void;
  onShrinkWrap: () => void;
  onDelete: () => void;
  onEditLabel: () => void;
}) {
  const wrapper = document.createElement("div");
  wrapper.className = "audio-cutter-region-content";

  const topRow = document.createElement("div");
  topRow.className = "audio-cutter-region-content__top-row";
  wrapper.append(topRow);

  const badge = document.createElement("div");
  badge.textContent = `${index + 1}`;
  badge.className = "audio-cutter-region-content__badge";
  topRow.append(badge);

  if (showControls) {
    const controls = document.createElement("div");
    controls.className = "audio-cutter-region-content__controls";

    controls.append(
      createIconButton({
        title: "Play segment",
        iconPath: "M5 3l14 9-14 9V3z",
        onClick: onPlay,
      }),
    );
    controls.append(
      createIconButton({
        title: "Shrink-wrap segment",
        iconPath:
          "M4 7h5 M4 12h8 M4 17h5 M20 7h-5 M20 12h-8 M20 17h-5 M10 7l2-2 2 2 M10 17l2 2 2-2",
        onClick: onShrinkWrap,
      }),
    );
    controls.append(
      createIconButton({
        title: label ? "Edit label" : "Add label",
        iconPath:
          "M12 20h9 M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z",
        onClick: onEditLabel,
      }),
    );
    controls.append(
      createIconButton({
        title: "Delete segment",
        iconPath: "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6 M10 11v6 M14 11v6",
        danger: true,
        onClick: onDelete,
      }),
    );
    topRow.append(controls);
  }

  if (showControls && label) {
    const labelElement = document.createElement("div");
    labelElement.textContent = label;
    labelElement.title = label;
    labelElement.className = "audio-cutter-region-content__label";
    topRow.append(labelElement);
  }

  if (showJoinHint) {
    const joinHint = document.createElement("div");
    joinHint.textContent = "join segments";
    joinHint.className = "audio-cutter-region-content__join-hint";
    wrapper.append(joinHint);
  }

  return wrapper;
}

function detectSpeechSegments(
  buffer: AudioBuffer,
  settings: DetectionSettings,
): SegmentDraft[] {
  return getCachedAudioSegmentation(buffer, settings).detectedSegments;
}

function float32ToInt16Sample(sample: number) {
  const clampedSample = clamp(sample, -1, 1);
  return clampedSample < 0
    ? Math.round(clampedSample * 0x8000)
    : Math.round(clampedSample * 0x7fff);
}

function toPlainArrayBuffer(view: Uint8Array | Int8Array) {
  const arrayBuffer = new ArrayBuffer(view.byteLength);
  new Uint8Array(arrayBuffer).set(
    new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
  );
  return arrayBuffer;
}

function audioBufferToWavBlob(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const totalFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalFrames * blockAlign;
  const output = new ArrayBuffer(44 + dataSize);
  const view = new DataView(output);

  let offset = 0;
  const writeString = (value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset, value.charCodeAt(index));
      offset += 1;
    }
  };

  writeString("RIFF");
  view.setUint32(offset, 36 + dataSize, true);
  offset += 4;
  writeString("WAVE");
  writeString("fmt ");
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, channels, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, byteRate, true);
  offset += 4;
  view.setUint16(offset, blockAlign, true);
  offset += 2;
  view.setUint16(offset, 16, true);
  offset += 2;
  writeString("data");
  view.setUint32(offset, dataSize, true);
  offset += 4;

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += 1) {
    for (let channelIndex = 0; channelIndex < channels; channelIndex += 1) {
      const sample = Math.max(
        -1,
        Math.min(1, buffer.getChannelData(channelIndex)?.[frameIndex] ?? 0),
      );
      view.setInt16(
        offset,
        sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff),
        true,
      );
      offset += 2;
    }
  }

  return new Blob([output], { type: "audio/wav" });
}

async function encodeSegmentAsMp3(
  buffer: AudioBuffer,
  startSeconds: number,
  endSeconds: number,
  skipRanges: TimeRange[] = [],
) {
  const { Mp3Encoder } = await getLamejsModule();
  const sampleRate = buffer.sampleRate;
  const channelCount = Math.min(2, Math.max(1, buffer.numberOfChannels));
  const encoder = new Mp3Encoder(channelCount, sampleRate, MP3_BITRATE_KBPS);
  const channelData = Array.from({ length: channelCount }, (_, index) =>
    buffer.getChannelData(index),
  );
  const mp3Chunks: Uint8Array[] = [];
  const keepRanges = getKeepRanges(
    {
      start: startSeconds,
      end: endSeconds,
    },
    skipRanges,
  );

  for (const keepRange of keepRanges.length > 0
    ? keepRanges
    : [{ start: startSeconds, end: endSeconds }]) {
    const startFrame = clamp(
      Math.floor(keepRange.start * sampleRate),
      0,
      buffer.length,
    );
    const endFrame = clamp(
      Math.ceil(keepRange.end * sampleRate),
      startFrame + 1,
      buffer.length,
    );
    const frameCount = Math.max(1, endFrame - startFrame);

    for (
      let frameOffset = 0;
      frameOffset < frameCount;
      frameOffset += MP3_SAMPLE_BLOCK_SIZE
    ) {
      const chunkFrameCount = Math.min(
        MP3_SAMPLE_BLOCK_SIZE,
        frameCount - frameOffset,
      );
      const leftChunk = new Int16Array(chunkFrameCount);
      const rightChunk =
        channelCount > 1 ? new Int16Array(chunkFrameCount) : null;

      for (let chunkIndex = 0; chunkIndex < chunkFrameCount; chunkIndex += 1) {
        const sourceFrameIndex = startFrame + frameOffset + chunkIndex;
        leftChunk[chunkIndex] = float32ToInt16Sample(
          channelData[0]?.[sourceFrameIndex] ?? 0,
        );
        if (rightChunk) {
          rightChunk[chunkIndex] = float32ToInt16Sample(
            channelData[1]?.[sourceFrameIndex] ?? 0,
          );
        }
      }

      const encodedChunk = rightChunk
        ? encoder.encodeBuffer(leftChunk, rightChunk)
        : encoder.encodeBuffer(leftChunk);
      if (encodedChunk.length > 0) {
        mp3Chunks.push(Uint8Array.from(encodedChunk));
      }
    }
  }

  const flushChunk = encoder.flush();
  if (flushChunk.length > 0) {
    mp3Chunks.push(Uint8Array.from(flushChunk));
  }

  return new Blob(
    mp3Chunks.map((chunk) => toPlainArrayBuffer(chunk)),
    {
      type: "audio/mpeg",
    },
  );
}

export default function AudioCutterDialog({
  open,
  onOpenChange,
  renderInDialog = true,
  expectedSegmentCount,
  transcriptItems,
  onUseSegments,
  primaryActionLabel = "Use segments in bulk editor",
  primaryActionPendingLabel,
  footerStatusText,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renderInDialog?: boolean;
  expectedSegmentCount: number;
  transcriptItems: AudioCutterTranscriptItem[];
  onUseSegments: (
    segments: AudioCutterPreparedSegment[],
  ) => Promise<boolean | void> | boolean | void;
  primaryActionLabel?: string;
  primaryActionPendingLabel?: string;
  footerStatusText?: string | null;
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const transcriptScrollRef = React.useRef<HTMLDivElement | null>(null);
  const wordTimelineRefs = React.useRef<Record<string, HTMLDivElement | null>>(
    {},
  );
  const transcriptRowRefs = React.useRef<Record<number, HTMLDivElement | null>>(
    {},
  );
  const suppressTranscriptAutoScrollRef = React.useRef(false);
  const transcriptAutoScrollLockTimeoutRef = React.useRef<number | null>(null);
  const transcriptAutoScrollLockContainerRef = React.useRef<HTMLElement | null>(
    null,
  );
  const transcriptAutoScrollLockScrollListenerRef = React.useRef<
    (() => void) | null
  >(null);
  const isSyncingRegionsRef = React.useRef(false);
  const activeDraftRegionIdRef = React.useRef<string | null>(null);
  const pendingRegionIdsRef = React.useRef<Set<string>>(new Set());
  const autoDetectRequestRef = React.useRef(0);
  const normalizeOperationRef = React.useRef(0);
  const lastHandledAutoDetectRequestRef = React.useRef(0);
  const segmentedPlaybackRef = React.useRef<SegmentedPlaybackState | null>(
    null,
  );
  const [audioFile, setAudioFile] = React.useState<File | null>(null);
  const [audioUrl, setAudioUrl] = React.useState("");
  const [audioBuffer, setAudioBuffer] = React.useState<AudioBuffer | null>(
    null,
  );
  const [audioError, setAudioError] = React.useState<string | null>(null);
  const [exportError, setExportError] = React.useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = React.useState(false);
  const [isNormalizingAudio, setIsNormalizingAudio] = React.useState(false);
  const [isExportingSegments, setIsExportingSegments] = React.useState(false);
  const [detectDialogOpen, setDetectDialogOpen] = React.useState(false);
  const [showIntroHelp, setShowIntroHelp] = React.useState(false);
  const [isDragOverAudioDropzone, setIsDragOverAudioDropzone] =
    React.useState(false);
  const [detectionSettings, setDetectionSettings] =
    React.useState<DetectionSettings>(() =>
      sanitizeDetectionSettings(undefined),
    );
  const [detectionForm, setDetectionForm] = React.useState<DetectionSettings>(
    () => sanitizeDetectionSettings(undefined),
  );
  const [segments, setSegments] = React.useState<Segment[]>([]);
  const [labelsById, setLabelsById] = React.useState<Record<string, string>>(
    {},
  );
  const [mergePreview, setMergePreview] = React.useState<MergePreview | null>(
    null,
  );
  const [zoomPxPerSec, setZoomPxPerSec] = React.useState(DEFAULT_WAVEFORM_ZOOM);
  const [waveformReady, setWaveformReady] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [viewportRange, setViewportRange] = React.useState({
    start: 0,
    end: 0,
  });
  const [hoveredSegmentId, setHoveredSegmentId] = React.useState<string | null>(
    null,
  );
  const [playbackTimeSeconds, setPlaybackTimeSeconds] = React.useState(0);
  const [selectedSegmentId, setSelectedSegmentId] = React.useState<
    string | null
  >(null);
  const [
    wordMarkTimeOverridesBySegmentId,
    setWordMarkTimeOverridesBySegmentId,
  ] = React.useState<Record<string, number[]>>({});
  const [draggingWordMarker, setDraggingWordMarker] = React.useState<{
    markIndex: number;
    segmentId: string;
  } | null>(null);
  const [regionsPlugin, setRegionsPlugin] = React.useState<ReturnType<
    typeof Regions.create
  > | null>(null);
  const typedRegionsPlugin =
    (regionsPlugin as unknown as RegionsPlugin | null) ?? EMPTY_REGIONS_PLUGIN;
  const sortedSegments = React.useMemo(
    () => sortSegments(segments),
    [segments],
  );
  const approximateWordMarksBySegmentId = React.useMemo(() => {
    const next: Record<string, AudioMark[]> = {};
    sortedSegments.forEach((segment, index) => {
      next[segment.id] = getApproximateWordMarks(
        transcriptItems[index]?.content.text ?? "",
        segment,
      );
    });
    return next;
  }, [sortedSegments, transcriptItems]);
  const wordMarksBySegmentId = React.useMemo(() => {
    const next: Record<string, AudioMark[]> = {};
    sortedSegments.forEach((segment) => {
      next[segment.id] = applyWordMarkTimeOverrides(
        approximateWordMarksBySegmentId[segment.id] ?? [],
        wordMarkTimeOverridesBySegmentId[segment.id],
        segment,
      );
    });
    return next;
  }, [
    approximateWordMarksBySegmentId,
    sortedSegments,
    wordMarkTimeOverridesBySegmentId,
  ]);
  const activeWordIndexBySegmentId = React.useMemo(() => {
    const next: Record<string, number> = {};
    sortedSegments.forEach((segment) => {
      next[segment.id] = getActiveWordMarkIndex(
        segment,
        wordMarksBySegmentId[segment.id] ?? [],
        playbackTimeSeconds,
      );
    });
    return next;
  }, [playbackTimeSeconds, sortedSegments, wordMarksBySegmentId]);

  React.useEffect(() => {
    if (regionsPlugin) return;
    setRegionsPlugin(Regions.create());
  }, [regionsPlugin]);

  React.useEffect(() => {
    const persistedSettings = loadPersistedDetectionSettings();
    if (!persistedSettings) return;
    setDetectionSettings(persistedSettings);
    setDetectionForm(persistedSettings);
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        DETECTION_SETTINGS_STORAGE_KEY,
        JSON.stringify(detectionSettings),
      );
    } catch {}
  }, [detectionSettings]);

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    height: 168,
    waveColor: "#1cb0f6",
    progressColor: "rgba(28,176,246,0.62)",
    cursorColor: "#0f5f83",
    normalize: true,
    barWidth: 3,
    barGap: 2,
    barRadius: 999,
    minPxPerSec: DEFAULT_WAVEFORM_ZOOM,
    fillParent: false,
    autoScroll: false,
    hideScrollbar: false,
    url: audioUrl || undefined,
    plugins: React.useMemo(
      () => (regionsPlugin ? [regionsPlugin] : []),
      [regionsPlugin],
    ),
  });

  const applySegmentSkipRanges = React.useCallback(
    (
      segment: { start: number; end: number },
      settingsOverride?: DetectionSettings,
    ) => {
      if (!audioBuffer) return [];
      const effectiveSettings = settingsOverride ?? detectionSettings;

      const { analysis } = getCachedAudioSegmentation(
        audioBuffer,
        effectiveSettings,
      );
      return getSegmentSkipRangesFromAnalysis(
        analysis,
        segment,
        effectiveSettings.maxInternalSilenceSeconds,
      );
    },
    [audioBuffer, detectionSettings],
  );

  const buildSegment = React.useCallback(
    (
      segment: { id?: string; start: number; end: number; label?: string },
      settingsOverride?: DetectionSettings,
    ) => ({
      id: segment.id ?? createSegmentId(),
      start: segment.start,
      end: segment.end,
      label: segment.label,
      skipRanges: applySegmentSkipRanges(segment, settingsOverride),
    }),
    [applySegmentSkipRanges],
  );

  const releaseTranscriptAutoScrollLock = React.useCallback(() => {
    const lockContainer = transcriptAutoScrollLockContainerRef.current;
    const lockScrollListener =
      transcriptAutoScrollLockScrollListenerRef.current;

    if (lockContainer && lockScrollListener) {
      lockContainer.removeEventListener("scroll", lockScrollListener);
    }

    transcriptAutoScrollLockContainerRef.current = null;
    transcriptAutoScrollLockScrollListenerRef.current = null;
    suppressTranscriptAutoScrollRef.current = false;
  }, []);

  const scheduleTranscriptAutoScrollUnlock = React.useCallback(() => {
    if (transcriptAutoScrollLockTimeoutRef.current !== null) {
      window.clearTimeout(transcriptAutoScrollLockTimeoutRef.current);
    }
    transcriptAutoScrollLockTimeoutRef.current = window.setTimeout(() => {
      transcriptAutoScrollLockTimeoutRef.current = null;
      releaseTranscriptAutoScrollLock();
    }, WAVEFORM_TO_TRANSCRIPT_SYNC_LOCK_MS);
  }, [releaseTranscriptAutoScrollLock]);

  const clearTranscriptAutoScrollLock = React.useCallback(() => {
    if (transcriptAutoScrollLockTimeoutRef.current !== null) {
      window.clearTimeout(transcriptAutoScrollLockTimeoutRef.current);
      transcriptAutoScrollLockTimeoutRef.current = null;
    }
    releaseTranscriptAutoScrollLock();
  }, [releaseTranscriptAutoScrollLock]);

  const cancelSegmentedPlayback = React.useCallback(() => {
    segmentedPlaybackRef.current = null;
  }, []);

  const lockTranscriptAutoScroll = React.useCallback(
    (scrollContainer: HTMLElement | null) => {
      clearTranscriptAutoScrollLock();
      suppressTranscriptAutoScrollRef.current = true;

      if (scrollContainer) {
        const extendTranscriptAutoScrollLock = () => {
          scheduleTranscriptAutoScrollUnlock();
        };

        transcriptAutoScrollLockContainerRef.current = scrollContainer;
        transcriptAutoScrollLockScrollListenerRef.current =
          extendTranscriptAutoScrollLock;
        scrollContainer.addEventListener(
          "scroll",
          extendTranscriptAutoScrollLock,
          {
            passive: true,
          },
        );
      }

      scheduleTranscriptAutoScrollUnlock();
    },
    [clearTranscriptAutoScrollLock, scheduleTranscriptAutoScrollUnlock],
  );

  const scrollTranscriptRowIntoView = React.useCallback(
    (rowIndex: number, behavior: ScrollBehavior = "smooth") => {
      const transcriptScroll = transcriptScrollRef.current;
      const transcriptRow = transcriptRowRefs.current[rowIndex];
      if (!transcriptScroll || !transcriptRow) return;

      const scrollRect = transcriptScroll.getBoundingClientRect();
      const rowRect = transcriptRow.getBoundingClientRect();
      const viewportTop = transcriptScroll.scrollTop;
      const viewportBottom = viewportTop + transcriptScroll.clientHeight;
      const rowTop = viewportTop + (rowRect.top - scrollRect.top);
      const rowBottom = rowTop + rowRect.height;

      const topAligned =
        Math.abs(transcriptScroll.scrollTop - Math.max(0, rowTop)) <= 1;
      if (topAligned && rowTop >= viewportTop && rowBottom <= viewportBottom) {
        return;
      }

      transcriptScroll.scrollTo({
        top: Math.max(0, rowTop),
        behavior,
      });
    },
    [],
  );

  const playSegmentAudio = React.useCallback(
    (segment: Segment) => {
      if (!wavesurfer) return;
      cancelSegmentedPlayback();

      const keepRanges = getKeepRanges(
        {
          start: segment.start,
          end: segment.end,
        },
        segment.skipRanges,
      );
      const firstRange = keepRanges[0];
      if (!firstRange) return;

      segmentedPlaybackRef.current = {
        currentRangeIndex: 0,
        didReachRangeEnd: false,
        keepRanges,
      };
      void wavesurfer.play(firstRange.start, firstRange.end);
    },
    [cancelSegmentedPlayback, wavesurfer],
  );

  const resetState = React.useCallback(() => {
    cancelSegmentedPlayback();
    clearTranscriptAutoScrollLock();
    normalizeOperationRef.current += 1;
    activeDraftRegionIdRef.current = null;
    pendingRegionIdsRef.current.clear();
    typedRegionsPlugin.clearRegions();
    setAudioFile(null);
    setAudioError(null);
    setExportError(null);
    setIsLoadingAudio(false);
    setIsNormalizingAudio(false);
    setIsExportingSegments(false);
    setDetectDialogOpen(false);
    setShowIntroHelp(false);
    setAudioBuffer(null);
    setSegments([]);
    setLabelsById({});
    setMergePreview(null);
    setDuration(0);
    setViewportRange({ start: 0, end: 0 });
    setWaveformReady(false);
    setHoveredSegmentId(null);
    setPlaybackTimeSeconds(0);
    setWordMarkTimeOverridesBySegmentId({});
    setDraggingWordMarker(null);
    setZoomPxPerSec(DEFAULT_WAVEFORM_ZOOM);
    setSelectedSegmentId(null);
    autoDetectRequestRef.current = 0;
    lastHandledAutoDetectRequestRef.current = 0;
    setAudioUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return "";
    });
  }, [
    cancelSegmentedPlayback,
    clearTranscriptAutoScrollLock,
    typedRegionsPlugin,
  ]);

  React.useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  React.useEffect(() => {
    return () => {
      cancelSegmentedPlayback();
      clearTranscriptAutoScrollLock();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl, cancelSegmentedPlayback, clearTranscriptAutoScrollLock]);

  React.useEffect(() => {
    setLabelsById((current) => {
      const next = Object.fromEntries(
        segments.map((segment) => [segment.id, current[segment.id] ?? ""]),
      );
      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(next);
      if (
        currentKeys.length === nextKeys.length &&
        nextKeys.every((key) => current[key] === next[key])
      ) {
        return current;
      }
      return next;
    });
  }, [segments]);

  const onEditSegmentLabel = React.useCallback(
    (segmentId: string) => {
      const currentLabel = labelsById[segmentId] ?? "";
      const nextLabel = window.prompt("Segment label", currentLabel);
      if (nextLabel === null) return;
      setLabelsById((current) => ({
        ...current,
        [segmentId]: nextLabel.trim(),
      }));
      setSelectedSegmentId(segmentId);
    },
    [labelsById],
  );

  const onRemoveSegment = React.useCallback((segmentId: string) => {
    if (activeDraftRegionIdRef.current === segmentId) {
      activeDraftRegionIdRef.current = null;
    }
    pendingRegionIdsRef.current.delete(segmentId);
    setSegments((current) =>
      current.filter((segment) => segment.id !== segmentId),
    );
    setLabelsById((current) => {
      if (!(segmentId in current)) return current;
      const next = { ...current };
      delete next[segmentId];
      return next;
    });
    setSelectedSegmentId((currentId) =>
      currentId === segmentId ? null : currentId,
    );
    setHoveredSegmentId((currentId) =>
      currentId === segmentId ? null : currentId,
    );
    setMergePreview((current) => {
      if (current?.activeId === segmentId || current?.targetId === segmentId) {
        return null;
      }
      return current;
    });
    setWordMarkTimeOverridesBySegmentId((current) => {
      if (!(segmentId in current)) return current;
      const next = { ...current };
      delete next[segmentId];
      return next;
    });
    setDraggingWordMarker((current) =>
      current?.segmentId === segmentId ? null : current,
    );
  }, []);

  const onShrinkWrapSegment = React.useCallback(
    (segmentId: string) => {
      if (!audioBuffer) return;
      setSegments((current) =>
        sortSegments(
          current.map((segment) => {
            if (segment.id !== segmentId) return segment;
            const nextBounds = getShrinkWrappedSegment(
              audioBuffer,
              segment,
              detectionSettings,
            );
            return buildSegment({
              ...segment,
              start: nextBounds.start,
              end: nextBounds.end,
            });
          }),
        ),
      );
      setHoveredSegmentId(segmentId);
      setSelectedSegmentId(segmentId);
    },
    [audioBuffer, buildSegment, detectionSettings],
  );

  const onShrinkWrapAll = React.useCallback(() => {
    if (!audioBuffer) return;
    setSegments((current) =>
      sortSegments(
        current.map((segment) => {
          const nextBounds = getShrinkWrappedSegment(
            audioBuffer,
            segment,
            detectionSettings,
          );
          return buildSegment({
            ...segment,
            start: nextBounds.start,
            end: nextBounds.end,
          });
        }),
      ),
    );
  }, [audioBuffer, buildSegment, detectionSettings]);

  const mergeOverlappingRegions = React.useCallback(
    (plugin: RegionsPlugin, activeId: string, targetId: string) => {
      const activeRegion = plugin
        .getRegions()
        .find((candidate) => candidate.id === activeId);
      const targetRegion = plugin
        .getRegions()
        .find((candidate) => candidate.id === targetId);
      if (!activeRegion || !targetRegion) return;

      const mergedStart = Math.min(activeRegion.start, targetRegion.start);
      const mergedEnd = Math.max(activeRegion.end, targetRegion.end);
      const activeExists = segments.some((segment) => segment.id === activeId);
      const targetExists = segments.some((segment) => segment.id === targetId);
      const survivingId = activeExists
        ? activeId
        : targetExists
          ? targetId
          : activeId;
      const removedId = survivingId === activeId ? targetId : activeId;
      const preservedLabel =
        labelsById[survivingId] || labelsById[removedId] || "";

      activeDraftRegionIdRef.current = null;
      pendingRegionIdsRef.current.delete(activeId);
      pendingRegionIdsRef.current.delete(targetId);
      setMergePreview(null);
      const removedRegion = plugin
        .getRegions()
        .find((candidate) => candidate.id === removedId);
      removedRegion?.remove();
      activeRegion.setOptions({
        drag: false,
      });
      setLabelsById((current) => {
        const next = { ...current };
        next[survivingId] = preservedLabel;
        delete next[removedId];
        return next;
      });
      setSegments((current) => {
        const next = current.filter(
          (segment) => segment.id !== activeId && segment.id !== targetId,
        );
        next.push(
          buildSegment({
            id: survivingId,
            start: mergedStart,
            end: mergedEnd,
          }),
        );
        return sortSegments(next);
      });
      setHoveredSegmentId(survivingId);
      setSelectedSegmentId(survivingId);
    },
    [buildSegment, labelsById, segments],
  );

  const pendingRegionTouchesCommittedSegment = React.useCallback(
    (region: SegmentRegion) =>
      segments.some((segment) =>
        overlapsSegment(segment, {
          start: region.start,
          end: region.end,
        }),
      ),
    [segments],
  );

  const syncRegionAppearance = React.useCallback(
    (plugin: RegionsPlugin) => {
      sortSegments(segments).forEach((segment, index) => {
        const region = plugin
          .getRegions()
          .find((candidate) => candidate.id === segment.id);
        if (!region) return;
        const wordMarks = wordMarksBySegmentId[segment.id] ?? [];
        const activeWordIndex = activeWordIndexBySegmentId[segment.id] ?? -1;

        region.setOptions({
          color: SEGMENT_COLOR,
          drag: false,
          resize: true,
          minLength: MIN_SEGMENT_LENGTH_SECONDS,
          content: createRegionContent({
            index,
            label: labelsById[segment.id] ?? "",
            showControls: hoveredSegmentId === segment.id,
            showJoinHint:
              mergePreview?.activeId === segment.id ||
              mergePreview?.targetId === segment.id,
            onPlay: () => {
              setSelectedSegmentId(segment.id);
              playSegmentAudio(segment);
            },
            onShrinkWrap: () => {
              onShrinkWrapSegment(segment.id);
            },
            onDelete: () => {
              onRemoveSegment(segment.id);
            },
            onEditLabel: () => onEditSegmentLabel(segment.id),
          }),
        });

        if (region.element) {
          region.element.onmouseenter = () => {
            setHoveredSegmentId(segment.id);
          };
          if (region.content instanceof HTMLElement) {
            region.content.style.position = "relative";
            region.content.style.zIndex = "1";
          }
          region.element.style.border = `1px solid ${
            selectedSegmentId === segment.id
              ? SEGMENT_ACTIVE_BORDER_COLOR
              : SEGMENT_BORDER_COLOR
          }`;
          region.element.style.borderRadius = "10px";
          region.element.style.boxShadow =
            selectedSegmentId === segment.id
              ? "inset 0 0 0 1px rgba(255,255,255,0.26), 0 0 0 1px rgba(28,176,246,0.2)"
              : "inset 0 0 0 1px rgba(255,255,255,0.2)";
          syncRegionSkipMarkers(region.element, segment);
          syncRegionWordMarkers(
            region.element,
            segment,
            wordMarks,
            activeWordIndex,
          );
        }
      });
    },
    [
      activeWordIndexBySegmentId,
      labelsById,
      mergePreview?.activeId,
      mergePreview?.targetId,
      onEditSegmentLabel,
      onRemoveSegment,
      playSegmentAudio,
      onShrinkWrapSegment,
      hoveredSegmentId,
      selectedSegmentId,
      segments,
      wordMarksBySegmentId,
    ],
  );

  const syncRegionsFromState = React.useCallback(
    (plugin: RegionsPlugin) => {
      isSyncingRegionsRef.current = true;
      try {
        const stateIds = new Set(segments.map((segment) => segment.id));
        for (const region of plugin.getRegions()) {
          const isActiveDraft = activeDraftRegionIdRef.current === region.id;
          if (!stateIds.has(region.id) && !isActiveDraft) {
            pendingRegionIdsRef.current.delete(region.id);
            region.remove();
          }
        }

        for (const segment of segments) {
          const existingRegion = plugin
            .getRegions()
            .find((candidate) => candidate.id === segment.id);
          if (existingRegion) {
            existingRegion.setOptions({
              start: segment.start,
              end: segment.end,
              drag: false,
              resize: true,
              minLength: MIN_SEGMENT_LENGTH_SECONDS,
            });
            continue;
          }

          plugin.addRegion({
            id: segment.id,
            start: segment.start,
            end: segment.end,
            color: SEGMENT_COLOR,
            drag: false,
            resize: true,
            minLength: MIN_SEGMENT_LENGTH_SECONDS,
          });
        }
      } finally {
        isSyncingRegionsRef.current = false;
      }
    },
    [segments],
  );

  React.useEffect(() => {
    if (!wavesurfer) return;
    wavesurfer.setOptions({
      minPxPerSec: zoomPxPerSec,
      fillParent: false,
      autoScroll: false,
      hideScrollbar: false,
    });
  }, [wavesurfer, zoomPxPerSec]);

  React.useEffect(() => {
    if (!wavesurfer) return;

    const updatePlaybackTime = (timeSeconds?: number) => {
      setPlaybackTimeSeconds(
        typeof timeSeconds === "number"
          ? timeSeconds
          : wavesurfer.getCurrentTime(),
      );
    };

    wavesurfer.on("timeupdate", updatePlaybackTime);
    wavesurfer.on("pause", updatePlaybackTime);
    wavesurfer.on("finish", updatePlaybackTime);

    return () => {
      wavesurfer.un("timeupdate", updatePlaybackTime);
      wavesurfer.un("pause", updatePlaybackTime);
      wavesurfer.un("finish", updatePlaybackTime);
    };
  }, [wavesurfer]);

  const updateViewportRange = React.useCallback(() => {
    const scrollContainer = getWaveformScrollElement(wavesurfer);
    if (
      !scrollContainer ||
      !waveformReady ||
      zoomPxPerSec <= 0 ||
      duration <= 0
    ) {
      setViewportRange((current) =>
        current.start === 0 && current.end === 0
          ? current
          : { start: 0, end: 0 },
      );
      return;
    }

    const nextStart = clamp(
      scrollContainer.scrollLeft / zoomPxPerSec,
      0,
      duration,
    );
    const nextEnd = clamp(
      (scrollContainer.scrollLeft + scrollContainer.clientWidth) / zoomPxPerSec,
      nextStart,
      duration,
    );

    setViewportRange((current) => {
      if (
        Math.abs(current.start - nextStart) < 0.01 &&
        Math.abs(current.end - nextEnd) < 0.01
      ) {
        return current;
      }
      return {
        start: nextStart,
        end: nextEnd,
      };
    });
  }, [duration, waveformReady, wavesurfer, zoomPxPerSec]);

  React.useEffect(() => {
    if (!wavesurfer) return;
    const scrollContainer = getWaveformScrollElement(wavesurfer);
    if (!scrollContainer) return;

    const onScroll = () => {
      updateViewportRange();
    };

    const resizeObserver = new ResizeObserver(() => {
      updateViewportRange();
    });
    const onUserWaveformInteraction = () => {
      clearTranscriptAutoScrollLock();
    };

    updateViewportRange();
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    scrollContainer.addEventListener("pointerdown", onUserWaveformInteraction, {
      passive: true,
    });
    scrollContainer.addEventListener("wheel", onUserWaveformInteraction, {
      passive: true,
    });
    resizeObserver.observe(scrollContainer);

    return () => {
      scrollContainer.removeEventListener("scroll", onScroll);
      scrollContainer.removeEventListener(
        "pointerdown",
        onUserWaveformInteraction,
      );
      scrollContainer.removeEventListener("wheel", onUserWaveformInteraction);
      resizeObserver.disconnect();
    };
  }, [clearTranscriptAutoScrollLock, updateViewportRange, wavesurfer]);

  const selectedSegmentIndex = React.useMemo(
    () =>
      sortedSegments.findIndex((segment) => segment.id === selectedSegmentId),
    [selectedSegmentId, sortedSegments],
  );

  const visibleSegmentIndexes = React.useMemo(() => {
    const indexes = new Set<number>();
    if (viewportRange.end <= viewportRange.start) return indexes;

    sortedSegments.forEach((segment, index) => {
      if (
        Math.min(segment.end, viewportRange.end) -
          Math.max(segment.start, viewportRange.start) >
        0
      ) {
        indexes.add(index);
      }
    });

    return indexes;
  }, [sortedSegments, viewportRange.end, viewportRange.start]);

  React.useEffect(() => {
    if (suppressTranscriptAutoScrollRef.current) return;

    const activeIndexes = [...visibleSegmentIndexes].sort(
      (left, right) => left - right,
    );
    const firstActiveIndex = activeIndexes[0];
    if (firstActiveIndex === undefined) return;

    const transcriptScroll = transcriptScrollRef.current;
    const transcriptRow = transcriptRowRefs.current[firstActiveIndex];
    if (!transcriptScroll || !transcriptRow) return;
    scrollTranscriptRowIntoView(firstActiveIndex, "smooth");
  }, [scrollTranscriptRowIntoView, visibleSegmentIndexes]);

  React.useEffect(() => {
    syncRegionsFromState(typedRegionsPlugin);
  }, [syncRegionsFromState, typedRegionsPlugin]);

  React.useEffect(() => {
    syncRegionAppearance(typedRegionsPlugin);
  }, [syncRegionAppearance, typedRegionsPlugin]);

  React.useEffect(() => {
    if (!wavesurfer) return;

    const markSegmentedRangeEndReached = () => {
      const playbackState = segmentedPlaybackRef.current;
      if (!playbackState) return;

      const currentRange =
        playbackState.keepRanges[playbackState.currentRangeIndex];
      if (!currentRange) {
        segmentedPlaybackRef.current = null;
        return;
      }

      if (playbackState.didReachRangeEnd) return;
      if (wavesurfer.getCurrentTime() < currentRange.end) return;

      segmentedPlaybackRef.current = {
        ...playbackState,
        didReachRangeEnd: true,
      };
    };

    const continueSegmentedPlayback = () => {
      const playbackState = segmentedPlaybackRef.current;
      if (!playbackState) return;
      if (!playbackState.didReachRangeEnd) return;

      const currentRange =
        playbackState.keepRanges[playbackState.currentRangeIndex];
      if (!currentRange) {
        segmentedPlaybackRef.current = null;
        return;
      }

      const nextRangeIndex = playbackState.currentRangeIndex + 1;
      const nextRange = playbackState.keepRanges[nextRangeIndex];
      if (!nextRange) {
        segmentedPlaybackRef.current = null;
        return;
      }

      segmentedPlaybackRef.current = {
        ...playbackState,
        currentRangeIndex: nextRangeIndex,
        didReachRangeEnd: false,
      };
      void wavesurfer.play(nextRange.start, nextRange.end);
    };

    wavesurfer.on("audioprocess", markSegmentedRangeEndReached);
    wavesurfer.on("pause", continueSegmentedPlayback);
    wavesurfer.on("finish", continueSegmentedPlayback);

    return () => {
      wavesurfer.un("audioprocess", markSegmentedRangeEndReached);
      wavesurfer.un("pause", continueSegmentedPlayback);
      wavesurfer.un("finish", continueSegmentedPlayback);
    };
  }, [wavesurfer]);

  React.useEffect(() => {
    if (!wavesurfer) return;
    const plugin = typedRegionsPlugin;

    const refreshRegionUi = () => {
      syncRegionAppearance(plugin);
    };

    const disableDragSelection = plugin.enableDragSelection(
      {
        color: SEGMENT_COLOR,
        drag: false,
        resize: true,
        minLength: 0.05,
      },
      2,
    );

    const onRegionCreated = (region: SegmentRegion) => {
      if (isSyncingRegionsRef.current) return;
      const isCommittedRegion = segments.some(
        (segment) => segment.id === region.id,
      );
      if (!isCommittedRegion) {
        for (const candidate of plugin.getRegions()) {
          if (
            candidate.id !== region.id &&
            !segments.some((segment) => segment.id === candidate.id)
          ) {
            pendingRegionIdsRef.current.delete(candidate.id);
            candidate.remove();
          }
        }
        activeDraftRegionIdRef.current = region.id;
      }
      if (!isCommittedRegion && pendingRegionTouchesCommittedSegment(region)) {
        activeDraftRegionIdRef.current = null;
        region.remove();
        return;
      }
      region.setOptions({
        drag: false,
        resize: true,
        minLength: 0.05,
      });
      if (!isCommittedRegion) {
        const draftDuration = region.end - region.start;
        activeDraftRegionIdRef.current = null;
        pendingRegionIdsRef.current.clear();
        if (draftDuration < MIN_PERSISTED_NEW_SEGMENT_SECONDS) {
          region.remove();
          setMergePreview(null);
          return;
        }
        setSegments((current) =>
          sortSegments([
            ...current,
            buildSegment({
              id: region.id,
              start: region.start,
              end: region.end,
            }),
          ]),
        );
        setHoveredSegmentId(region.id);
      }
      setSelectedSegmentId(region.id);
      refreshRegionUi();
    };
    const onRegionUpdate = (region: SegmentRegion) => {
      if (isSyncingRegionsRef.current) return;
      if (
        pendingRegionIdsRef.current.has(region.id) &&
        activeDraftRegionIdRef.current !== region.id
      ) {
        pendingRegionIdsRef.current.delete(region.id);
        region.remove();
        return;
      }
      if (
        pendingRegionIdsRef.current.has(region.id) &&
        pendingRegionTouchesCommittedSegment(region)
      ) {
        activeDraftRegionIdRef.current = null;
        pendingRegionIdsRef.current.delete(region.id);
        setMergePreview(null);
        region.remove();
        return;
      }
      const overlappingRegion = getOverlappingRegion(plugin, region);
      setMergePreview(
        overlappingRegion
          ? { activeId: region.id, targetId: overlappingRegion.id }
          : null,
      );
      refreshRegionUi();
    };
    const onRegionUpdated = (region: SegmentRegion) => {
      if (isSyncingRegionsRef.current) return;
      if (
        pendingRegionIdsRef.current.has(region.id) &&
        pendingRegionTouchesCommittedSegment(region)
      ) {
        activeDraftRegionIdRef.current = null;
        pendingRegionIdsRef.current.delete(region.id);
        setMergePreview(null);
        region.remove();
        return;
      }
      const overlappingRegion = getOverlappingRegion(plugin, region);
      if (overlappingRegion) {
        mergeOverlappingRegions(plugin, region.id, overlappingRegion.id);
        return;
      }

      const isPending = pendingRegionIdsRef.current.has(region.id);
      if (isPending) {
        activeDraftRegionIdRef.current = null;
        pendingRegionIdsRef.current.delete(region.id);
        setMergePreview(null);
        region.remove();
        return;
      } else {
        setSegments((current) =>
          sortSegments(
            current.map((segment) =>
              segment.id === region.id
                ? buildSegment({
                    ...segment,
                    start: region.start,
                    end: region.end,
                  })
                : segment,
            ),
          ),
        );
        setHoveredSegmentId(region.id);
      }
      setMergePreview(null);
      refreshRegionUi();
    };
    const onRegionRemoved = (region: SegmentRegion) => {
      if (isSyncingRegionsRef.current) return;
      if (activeDraftRegionIdRef.current === region.id) {
        activeDraftRegionIdRef.current = null;
      }
      pendingRegionIdsRef.current.delete(region.id);
      setMergePreview((current) => {
        if (
          current?.activeId === region.id ||
          current?.targetId === region.id
        ) {
          return null;
        }
        return current;
      });
      refreshRegionUi();
    };
    const onReady = () => {
      setWaveformReady(true);
      setDuration(wavesurfer.getDuration());
      refreshRegionUi();
    };

    plugin.on("region-created", onRegionCreated);
    plugin.on("region-update", onRegionUpdate);
    plugin.on("region-updated", onRegionUpdated);
    plugin.on("region-removed", onRegionRemoved);
    wavesurfer.on("ready", onReady);

    return () => {
      plugin.un("region-created", onRegionCreated);
      plugin.un("region-update", onRegionUpdate);
      plugin.un("region-updated", onRegionUpdated);
      plugin.un("region-removed", onRegionRemoved);
      wavesurfer.un("ready", onReady);
      disableDragSelection();
    };
  }, [
    buildSegment,
    mergeOverlappingRegions,
    pendingRegionTouchesCommittedSegment,
    segments,
    syncRegionAppearance,
    typedRegionsPlugin,
    wavesurfer,
  ]);

  const replaceSegments = React.useCallback(
    (nextSegments: SegmentDraft[], settingsOverride?: DetectionSettings) => {
      activeDraftRegionIdRef.current = null;
      pendingRegionIdsRef.current.clear();
      setMergePreview(null);
      const next = sortSegments(
        nextSegments.map((segment) =>
          buildSegment(
            {
              id: createSegmentId(),
              start: segment.start,
              end: segment.end,
            },
            settingsOverride,
          ),
        ),
      );
      setSegments(next);
      setSelectedSegmentId(next[0]?.id ?? null);
    },
    [buildSegment],
  );

  const runAutoDetect = React.useCallback(() => {
    if (!audioBuffer) return;
    replaceSegments(detectSpeechSegments(audioBuffer, detectionSettings));
  }, [audioBuffer, detectionSettings, replaceSegments]);

  React.useEffect(() => {
    if (!audioBuffer || !waveformReady) return;
    if (
      lastHandledAutoDetectRequestRef.current >= autoDetectRequestRef.current
    ) {
      return;
    }

    lastHandledAutoDetectRequestRef.current = autoDetectRequestRef.current;
    runAutoDetect();
  }, [audioBuffer, runAutoDetect, waveformReady]);

  const updateLoadedAudio = React.useCallback((nextBuffer: AudioBuffer) => {
    setAudioBuffer(nextBuffer);
    setAudioUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(audioBufferToWavBlob(nextBuffer));
    });
  }, []);

  const onFileChange = React.useCallback(
    async (file: File | null) => {
      if (!file) return;

      const requestToken = autoDetectRequestRef.current + 1;
      autoDetectRequestRef.current = requestToken;
      normalizeOperationRef.current += 1;
      setIsLoadingAudio(true);
      setIsNormalizingAudio(false);
      setAudioError(null);
      setExportError(null);
      setAudioFile(file);
      setAudioBuffer(null);
      setWaveformReady(false);
      activeDraftRegionIdRef.current = null;
      pendingRegionIdsRef.current.clear();
      setSelectedSegmentId(null);
      setSegments([]);
      setLabelsById({});
      setMergePreview(null);
      setPlaybackTimeSeconds(0);
      setWordMarkTimeOverridesBySegmentId({});
      setDraggingWordMarker(null);
      setDuration(0);
      typedRegionsPlugin.clearRegions();

      setAudioUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return "";
      });

      try {
        const decoded = await decodeAudioData(await file.arrayBuffer());
        if (requestToken !== autoDetectRequestRef.current) return;
        updateLoadedAudio(decoded);
      } catch (error) {
        if (requestToken !== autoDetectRequestRef.current) return;
        setAudioBuffer(null);
        setAudioError(
          getErrorMessage(error, "Could not read the selected audio file."),
        );
      } finally {
        if (requestToken === autoDetectRequestRef.current) {
          setIsLoadingAudio(false);
        }
      }
    },
    [typedRegionsPlugin, updateLoadedAudio],
  );

  const onFileInputChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      event.target.value = "";
      await onFileChange(file);
    },
    [onFileChange],
  );

  const onAudioDropzoneDragEnter = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      setIsDragOverAudioDropzone(true);
    },
    [],
  );

  const onAudioDropzoneDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setIsDragOverAudioDropzone(true);
    },
    [],
  );

  const onAudioDropzoneDragLeave = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setIsDragOverAudioDropzone(false);
      }
    },
    [],
  );

  const onAudioDropzoneDrop = React.useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOverAudioDropzone(false);
      const file = event.dataTransfer.files?.[0] ?? null;
      await onFileChange(file);
    },
    [onFileChange],
  );

  const onNormalizeAudio = React.useCallback(async () => {
    if (
      !audioBuffer ||
      isNormalizingAudio ||
      isExportingSegments ||
      isLoadingAudio
    ) {
      return;
    }

    const normalizeToken = normalizeOperationRef.current + 1;
    normalizeOperationRef.current = normalizeToken;
    setIsNormalizingAudio(true);
    setAudioError(null);
    setExportError(null);

    try {
      await waitForNextAnimationFrame();
      if (normalizeToken !== normalizeOperationRef.current) return;
      const normalized = normalizeAudioBufferPeak(audioBuffer);
      if (
        normalized.changed &&
        normalizeToken === normalizeOperationRef.current
      ) {
        updateLoadedAudio(normalized.buffer);
      }
    } catch (error) {
      if (normalizeToken !== normalizeOperationRef.current) return;
      setAudioError(
        getErrorMessage(error, "Could not normalize the loaded audio."),
      );
    } finally {
      if (normalizeToken === normalizeOperationRef.current) {
        setIsNormalizingAudio(false);
      }
    }
  }, [
    audioBuffer,
    isExportingSegments,
    isLoadingAudio,
    isNormalizingAudio,
    updateLoadedAudio,
  ]);

  const onPlayPause = React.useCallback(() => {
    cancelSegmentedPlayback();
    wavesurfer?.playPause();
  }, [cancelSegmentedPlayback, wavesurfer]);

  const scrollWaveformToSegment = React.useCallback(
    (segment: Segment) => {
      if (!waveformReady || zoomPxPerSec <= 0) return;

      const scrollContainer =
        getWaveformScrollElement(wavesurfer) ?? scrollContainerRef.current;
      if (!scrollContainer) return;

      const segmentStartPx = segment.start * zoomPxPerSec;
      const segmentEndPx = segment.end * zoomPxPerSec;
      const viewportStartPx = scrollContainer.scrollLeft;
      const viewportEndPx = viewportStartPx + scrollContainer.clientWidth;

      if (segmentStartPx >= viewportStartPx && segmentEndPx <= viewportEndPx) {
        return;
      }

      const segmentWidthPx = segmentEndPx - segmentStartPx;
      const centeredLeftPx =
        segmentStartPx -
        Math.max(0, (scrollContainer.clientWidth - segmentWidthPx) / 2);
      const maxScrollLeft = Math.max(
        0,
        scrollContainer.scrollWidth - scrollContainer.clientWidth,
      );

      lockTranscriptAutoScroll(scrollContainer);
      scrollContainer.scrollTo({
        left: clamp(centeredLeftPx, 0, maxScrollLeft),
        behavior: "smooth",
      });
    },
    [lockTranscriptAutoScroll, waveformReady, wavesurfer, zoomPxPerSec],
  );

  const onPlayApproximateWord = React.useCallback(
    (segment: Segment, marks: AudioMark[], markIndex: number) => {
      if (!wavesurfer) return;

      const playbackRange = getApproximateWordPlaybackRange(
        segment,
        marks,
        markIndex,
      );
      if (!playbackRange) return;

      cancelSegmentedPlayback();
      setSelectedSegmentId(segment.id);
      scrollWaveformToSegment(segment);
      void wavesurfer.play(
        playbackRange.startSeconds,
        playbackRange.endSeconds,
      );
    },
    [cancelSegmentedPlayback, scrollWaveformToSegment, wavesurfer],
  );

  const updateWordMarkTimeOverride = React.useCallback(
    (
      segment: Segment,
      marks: AudioMark[],
      markIndex: number,
      nextTimeMs: number,
    ) => {
      const keepRanges = getKeepRanges(
        {
          start: segment.start,
          end: segment.end,
        },
        segment.skipRanges,
      );
      if (keepRanges.length === 0) return;

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
      const previousTimeMs =
        markIndex > 0
          ? (marks[markIndex - 1]?.time ?? keepStartMs)
          : keepStartMs;
      const nextMarkTimeMs =
        markIndex < marks.length - 1
          ? (marks[markIndex + 1]?.time ?? keepEndMs)
          : keepEndMs;
      const minTimeMs =
        markIndex === 0 ? keepStartMs : previousTimeMs + MIN_WORD_MARK_GAP_MS;
      const maxTimeMs =
        markIndex === marks.length - 1
          ? keepEndMs
          : nextMarkTimeMs - MIN_WORD_MARK_GAP_MS;
      const boundedTimeSeconds = clampTimeToKeepRanges(
        clamp(nextTimeMs, minTimeMs, Math.max(minTimeMs, maxTimeMs)) / 1000,
        keepRanges,
      );

      setWordMarkTimeOverridesBySegmentId((current) => {
        const segmentOverrides = [...(current[segment.id] ?? [])];
        segmentOverrides[markIndex] = Math.round(boundedTimeSeconds * 1000);
        return {
          ...current,
          [segment.id]: segmentOverrides,
        };
      });
    },
    [],
  );

  const updateDraggedWordMarker = React.useCallback(
    (segmentId: string, markIndex: number, clientX: number) => {
      const segment = sortedSegments.find(
        (candidate) => candidate.id === segmentId,
      );
      const marks = wordMarksBySegmentId[segmentId] ?? [];
      const timeline = wordTimelineRefs.current[segmentId];
      if (!segment || !timeline || marks.length === 0) return;

      const rect = timeline.getBoundingClientRect();
      if (rect.width <= 0) return;

      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const rawTimeMs = Math.round(
        (segment.start + (segment.end - segment.start) * ratio) * 1000,
      );
      updateWordMarkTimeOverride(segment, marks, markIndex, rawTimeMs);
    },
    [sortedSegments, updateWordMarkTimeOverride, wordMarksBySegmentId],
  );

  const onStartWordMarkerDrag = React.useCallback(
    (
      event: React.PointerEvent<HTMLButtonElement>,
      segmentId: string,
      markIndex: number,
    ) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      setHoveredSegmentId(segmentId);
      setSelectedSegmentId(segmentId);
      setDraggingWordMarker({ markIndex, segmentId });
      updateDraggedWordMarker(segmentId, markIndex, event.clientX);
    },
    [updateDraggedWordMarker],
  );

  React.useEffect(() => {
    if (!draggingWordMarker) return;

    const onPointerMove = (event: PointerEvent) => {
      updateDraggedWordMarker(
        draggingWordMarker.segmentId,
        draggingWordMarker.markIndex,
        event.clientX,
      );
    };
    const onPointerUp = () => {
      setDraggingWordMarker(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [draggingWordMarker, updateDraggedWordMarker]);

  const onPlaySegment = React.useCallback(
    (segment: Segment) => {
      setSelectedSegmentId(segment.id);
      scrollWaveformToSegment(segment);
      playSegmentAudio(segment);
    },
    [playSegmentAudio, scrollWaveformToSegment],
  );

  const selectSegmentByIndex = React.useCallback(
    (index: number) => {
      const segment = sortedSegments[index];
      if (!segment) return;

      setHoveredSegmentId(segment.id);
      onPlaySegment(segment);
      scrollTranscriptRowIntoView(index, "smooth");
    },
    [onPlaySegment, scrollTranscriptRowIntoView, sortedSegments],
  );

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (detectDialogOpen) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (isEditableTarget(event.target)) return;
      if (sortedSegments.length === 0) return;

      if (event.code === "Space") {
        event.preventDefault();
        const activeSegment =
          sortedSegments[selectedSegmentIndex] ?? sortedSegments[0];
        if (!activeSegment) return;
        onPlaySegment(activeSegment);
        return;
      }

      if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
        event.preventDefault();
        const delta = event.code === "ArrowRight" ? 1 : -1;
        const currentIndex =
          selectedSegmentIndex >= 0 ? selectedSegmentIndex : 0;
        const nextIndex = clamp(
          currentIndex + delta,
          0,
          sortedSegments.length - 1,
        );
        selectSegmentByIndex(nextIndex);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    detectDialogOpen,
    onPlaySegment,
    open,
    selectSegmentByIndex,
    selectedSegmentIndex,
    sortedSegments,
  ]);

  const onZoomIn = React.useCallback(() => {
    setZoomPxPerSec((current) =>
      Math.min(MAX_WAVEFORM_ZOOM, current + WAVEFORM_ZOOM_STEP),
    );
  }, []);

  const onZoomOut = React.useCallback(() => {
    setZoomPxPerSec((current) =>
      Math.max(MIN_WAVEFORM_ZOOM, current - WAVEFORM_ZOOM_STEP),
    );
  }, []);

  const onZoomFit = React.useCallback(() => {
    if (!wavesurfer || !waveformReady || !scrollContainerRef.current) return;
    const nextDuration = wavesurfer.getDuration();
    if (!nextDuration || !Number.isFinite(nextDuration)) return;
    setZoomPxPerSec(
      clamp(
        Math.round(scrollContainerRef.current.clientWidth / nextDuration),
        MIN_WAVEFORM_ZOOM,
        MAX_WAVEFORM_ZOOM,
      ),
    );
  }, [waveformReady, wavesurfer]);

  const onClearSegments = React.useCallback(() => {
    activeDraftRegionIdRef.current = null;
    pendingRegionIdsRef.current.clear();
    typedRegionsPlugin.clearRegions();
    setSegments([]);
    setLabelsById({});
    setMergePreview(null);
    setWordMarkTimeOverridesBySegmentId({});
    setDraggingWordMarker(null);
    setSelectedSegmentId(null);
  }, [typedRegionsPlugin]);

  const createSegmentFiles = React.useCallback(async () => {
    if (!audioBuffer || !audioFile || segments.length === 0) return;

    const baseName = getFileBaseName(audioFile.name) || "segment";
    const files: File[] = [];
    for (const [index, segment] of sortSegments(segments).entries()) {
      const blob = await encodeSegmentAsMp3(
        audioBuffer,
        segment.start,
        segment.end,
        segment.skipRanges,
      );
      files.push(
        new File(
          [blob],
          `${baseName}-${String(index + 1).padStart(3, "0")}.mp3`,
          {
            type: "audio/mpeg",
          },
        ),
      );
    }
    return files;
  }, [audioBuffer, audioFile, segments]);

  const onDownloadSegmentZip = React.useCallback(async () => {
    if (isExportingSegments) return;

    setIsExportingSegments(true);
    setExportError(null);
    try {
      const files = await createSegmentFiles();
      if (!files || files.length === 0) return;

      const entries = await Promise.all(
        files.map(
          async (file) =>
            [file.name, new Uint8Array(await file.arrayBuffer())] as const,
        ),
      );
      const zipBytes = zipSync(Object.fromEntries(entries), { level: 0 });
      const zipArrayBuffer = new ArrayBuffer(zipBytes.byteLength);
      new Uint8Array(zipArrayBuffer).set(zipBytes);
      const zipBlob = new Blob([zipArrayBuffer], {
        type: "application/zip",
      });
      const zipName = `${getFileBaseName(audioFile?.name || "segments")}.zip`;
      const downloadUrl = URL.createObjectURL(zipBlob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = zipName;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to export segment zip", error);
      setExportError(
        `Could not export the segment zip: ${getErrorMessage(
          error,
          "Unknown error.",
        )}`,
      );
    } finally {
      setIsExportingSegments(false);
    }
  }, [audioFile?.name, createSegmentFiles, isExportingSegments]);

  const onUseSegmentCuts = React.useCallback(async () => {
    if (isExportingSegments) return;

    setIsExportingSegments(true);
    setExportError(null);
    try {
      const files = await createSegmentFiles();
      if (!files || files.length === 0) return;

      const preparedSegments = files.flatMap((file, index) => {
        const item = transcriptItems[index];
        const segment = sortedSegments[index];
        if (!item || !segment) return [];

        return [
          {
            file,
            itemId: item.id,
            lineIndex: item.lineIndex,
            ssml: item.ssml,
            keypoints: getKeypointsFromWordMarks(
              wordMarksBySegmentId[segment.id] ?? [],
            ),
          },
        ];
      });
      if (preparedSegments.length === 0) return;

      const shouldClose = await onUseSegments(preparedSegments);
      if (shouldClose !== false) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to prepare segment cuts", error);
      setExportError(
        `Could not prepare segment audio: ${getErrorMessage(
          error,
          "Unknown error.",
        )}`,
      );
    } finally {
      setIsExportingSegments(false);
    }
  }, [
    createSegmentFiles,
    isExportingSegments,
    onOpenChange,
    onUseSegments,
    sortedSegments,
    transcriptItems,
    wordMarksBySegmentId,
  ]);

  const segmentCountMismatch =
    expectedSegmentCount > 0 && segments.length !== expectedSegmentCount;

  const openDetectDialog = React.useCallback(() => {
    setDetectionForm(detectionSettings);
    setDetectDialogOpen(true);
  }, [detectionSettings]);

  const updateDetectionFormValue = React.useCallback(
    (key: keyof DetectionSettings, value: string) => {
      const numericValue = Number(value);
      setDetectionForm((current) => ({
        ...current,
        [key]: Number.isFinite(numericValue) ? numericValue : 0,
      }));
    },
    [],
  );

  const applyDetectionSettings = React.useCallback(() => {
    const nextSettings = sanitizeDetectionSettings(detectionForm);
    setDetectionSettings(nextSettings);
    setDetectionForm(nextSettings);
    setDetectDialogOpen(false);
    if (!audioBuffer) return;
    replaceSegments(
      detectSpeechSegments(audioBuffer, nextSettings),
      nextSettings,
    );
  }, [audioBuffer, detectionForm, replaceSegments]);

  const content = (
    <div
      className={
        renderInDialog
          ? "flex h-full min-w-[1080px] flex-col bg-[var(--body-background)]"
          : "flex min-h-full w-full flex-col bg-[var(--body-background)]"
      }
    >
      {renderInDialog ? (
        <div className="border-b border-[var(--color_base_border)] px-5 py-3">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-[var(--text-color)]">
            <ScissorsIcon className="h-5 w-5 text-[#0f5f83]" />
            Audio cutter
          </DialogTitle>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--text-color-dim)]">
            <DialogDescription className="m-0 max-w-[85ch] text-sm text-[var(--text-color-dim)]">
              Load one recording, detect cuts, then fine-tune them in the
              waveform and transcript.
            </DialogDescription>
            <button
              type="button"
              className="inline-flex h-6 items-center justify-center rounded-full border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-2.5 text-xs font-medium leading-none text-[var(--text-color-dim)] transition-colors hover:bg-[var(--color_base_background)]"
              onClick={() => setShowIntroHelp((current) => !current)}
            >
              {showIntroHelp ? "Hide help" : "Show help"}
            </button>
          </div>
          {showIntroHelp ? (
            <DialogDescription className="mt-2 max-w-[85ch] text-sm text-[var(--text-color-dim)]">
              Drag the start and end edges until the cuts line up. Drag on the
              waveform to add extra segments manually.
            </DialogDescription>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color_base_border)] px-5 py-3">
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-3 text-sm font-medium leading-none transition-colors hover:bg-[var(--color_base_background)] disabled:cursor-default disabled:opacity-70"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoadingAudio}
        >
          <UploadIcon className="h-4 w-4" />
          {isLoadingAudio ? "Reading audio..." : "Upload long audio"}
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-3 text-sm font-medium leading-none transition-colors hover:bg-[var(--color_base_background)] disabled:cursor-default disabled:opacity-70"
          onClick={() => {
            void onNormalizeAudio();
          }}
          disabled={
            !audioBuffer ||
            isNormalizingAudio ||
            isExportingSegments ||
            isLoadingAudio
          }
          title={
            audioBuffer
              ? "Normalize the loaded source audio"
              : "Load audio first"
          }
        >
          {isNormalizingAudio ? "Normalizing..." : "Normalize audio"}
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-3 text-sm font-medium leading-none transition-colors hover:bg-[var(--color_base_background)] disabled:cursor-default disabled:opacity-70"
          onClick={openDetectDialog}
          disabled={!audioBuffer}
          title={
            audioBuffer ? "Tune silence detection settings" : "Load audio first"
          }
        >
          <WandSparklesIcon className="h-4 w-4" />
          Detect silence
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-3 text-sm font-medium leading-none transition-colors hover:bg-[var(--color_base_background)] disabled:cursor-default disabled:opacity-70"
          onClick={onShrinkWrapAll}
          disabled={!audioBuffer || segments.length === 0}
        >
          Shrink-wrap all
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-3 text-sm font-medium leading-none transition-colors hover:bg-[var(--color_base_background)] disabled:cursor-default disabled:opacity-70"
          onClick={() => {
            void onDownloadSegmentZip();
          }}
          disabled={
            !audioBuffer || segments.length === 0 || isExportingSegments
          }
        >
          <DownloadIcon className="h-4 w-4" />
          {isExportingSegments ? "Encoding MP3..." : "Download zip"}
        </button>
        <PlayAudio onClick={audioUrl ? onPlayPause : undefined} />
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-2 leading-none transition-colors hover:bg-[var(--color_base_background)]"
            onClick={onZoomOut}
          >
            -
          </button>
          <button
            type="button"
            className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-2 leading-none transition-colors hover:bg-[var(--color_base_background)]"
            onClick={onZoomIn}
          >
            +
          </button>
          <button
            type="button"
            className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-2 leading-none transition-colors hover:bg-[var(--color_base_background)]"
            onClick={onZoomFit}
          >
            Fit
          </button>
        </div>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept="audio/*"
          onChange={onFileInputChange}
        />
        <div className="min-w-0 flex-1 truncate text-sm text-[var(--text-color-dim)]">
          {audioFile?.name || "No source audio selected."}
        </div>
      </div>

      <Dialog open={detectDialogOpen} onOpenChange={setDetectDialogOpen}>
        <DialogContent className="max-w-[540px]">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-[var(--text-color)]">
            <WandSparklesIcon className="h-5 w-5 text-[#0f5f83]" />
            Silence detection
          </DialogTitle>
          <DialogDescription className="max-w-[60ch] text-sm text-[var(--text-color-dim)]">
            Tune how aggressively the cutter splits on silence. Short pauses can
            stay inside the same segment, and you can add lead-in or tail buffer
            around each detected block. Longer pauses inside a segment can also
            be capped with export skip markers.
          </DialogDescription>

          <div className="grid gap-4 pt-2">
            <div className="rounded-[20px] border border-[var(--color_base_border)] bg-[var(--body-background-faint)] p-4">
              <div className="mb-1 text-sm font-semibold text-[var(--text-color)]">
                Minimum silence to split
              </div>
              <div className="mb-3 text-xs text-[var(--text-color-dim)]">
                Silences shorter than this stay in the same segment.
              </div>
              <Input
                type="number"
                min="0.1"
                max="5"
                step="0.1"
                value={detectionForm.minSilenceSeconds}
                onChange={(event) => {
                  updateDetectionFormValue(
                    "minSilenceSeconds",
                    event.target.value,
                  );
                }}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-[var(--color_base_border)] bg-[var(--body-background-faint)] p-4">
                <div className="mb-1 text-sm font-semibold text-[var(--text-color)]">
                  Start buffer
                </div>
                <div className="mb-3 text-xs text-[var(--text-color-dim)]">
                  Extra audio kept before the detected speech starts.
                </div>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.01"
                  value={detectionForm.startBufferSeconds}
                  onChange={(event) => {
                    updateDetectionFormValue(
                      "startBufferSeconds",
                      event.target.value,
                    );
                  }}
                />
              </div>

              <div className="rounded-[20px] border border-[var(--color_base_border)] bg-[var(--body-background-faint)] p-4">
                <div className="mb-1 text-sm font-semibold text-[var(--text-color)]">
                  End buffer
                </div>
                <div className="mb-3 text-xs text-[var(--text-color-dim)]">
                  Extra audio kept after the detected speech ends.
                </div>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.01"
                  value={detectionForm.endBufferSeconds}
                  onChange={(event) => {
                    updateDetectionFormValue(
                      "endBufferSeconds",
                      event.target.value,
                    );
                  }}
                />
              </div>
            </div>

            <div className="rounded-[20px] border border-[var(--color_base_border)] bg-[var(--body-background-faint)] p-4">
              <div className="mb-1 text-sm font-semibold text-[var(--text-color)]">
                Max silence kept inside segment
              </div>
              <div className="mb-3 text-xs text-[var(--text-color-dim)]">
                Longer pauses stay in the segment but are trimmed from export as
                internal skip markers. Set to 0 to keep internal pauses as-is.
              </div>
              <Input
                type="number"
                min="0"
                max="3"
                step="0.05"
                value={detectionForm.maxInternalSilenceSeconds}
                onChange={(event) => {
                  updateDetectionFormValue(
                    "maxInternalSilenceSeconds",
                    event.target.value,
                  );
                }}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-xs text-[var(--text-color-dim)]">
              Current: split after {detectionSettings.minSilenceSeconds}s of
              silence, with +{detectionSettings.startBufferSeconds}s / +
              {detectionSettings.endBufferSeconds}s buffer
              {detectionSettings.maxInternalSilenceSeconds > 0
                ? `, and cap internal pauses at ${detectionSettings.maxInternalSilenceSeconds}s.`
                : ", and keep internal pauses untouched."}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-3 text-sm font-medium leading-none transition-colors hover:bg-[var(--color_base_background)]"
                onClick={() => setDetectDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-md border border-[#0f5f83] bg-[#1cb0f6] px-3 text-sm font-semibold leading-none text-white transition-colors hover:bg-[#1598d7]"
                onClick={applyDetectionSettings}
              >
                Detect
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[var(--text-color)]">
                Waveform
              </div>
              <div className="text-xs text-[var(--text-color-dim)]">
                Drag across the waveform to add a segment. Drag a segment body
                to move it. Drag either edge to resize it.
              </div>
            </div>
            <div className="flex items-center gap-3 text-right text-xs text-[var(--text-color-dim)]">
              {segments.length > 0 ? (
                <button
                  type="button"
                  className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-2 leading-none transition-colors hover:bg-[var(--color_base_background)]"
                  onClick={onClearSegments}
                >
                  Clear segments
                </button>
              ) : null}
              <div>
                <div>
                  {expectedSegmentCount > 0
                    ? `${segments.length} segments / ${expectedSegmentCount} expected`
                    : `${segments.length} segments ready`}
                </div>
                <div>
                  {duration > 0 ? formatSeconds(duration) : "00:00.000"}
                </div>
              </div>
            </div>
          </div>
          <div
            className={`rounded-xl border transition-colors ${
              isDragOverAudioDropzone
                ? "border-[#1cb0f6] bg-[rgba(28,176,246,0.08)]"
                : "border-[var(--color_base_border)] bg-[linear-gradient(180deg,rgba(28,176,246,0.05),rgba(15,95,131,0.02))]"
            }`}
            onDragEnter={onAudioDropzoneDragEnter}
            onDragLeave={onAudioDropzoneDragLeave}
            onDragOver={onAudioDropzoneDragOver}
            onDrop={onAudioDropzoneDrop}
          >
            <div
              ref={scrollContainerRef}
              className="h-fit overflow-x-auto overflow-y-hidden rounded-xl p-4"
            >
              <div ref={containerRef} />
            </div>
            <div className="border-t border-[var(--color_base_border)] px-4 py-2 text-xs text-[var(--text-color-dim)]">
              {isDragOverAudioDropzone
                ? "Drop audio here to replace the current source file."
                : "Drop an audio file here, or use Upload long audio."}
            </div>
          </div>
          {audioError ? (
            <p className="mt-3 text-sm text-[#b33b3b]">{audioError}</p>
          ) : null}
          {exportError ? (
            <p className="mt-3 text-sm text-[#b33b3b]">{exportError}</p>
          ) : null}
          <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[var(--color_base_border)] bg-[var(--body-background-faint)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text-color)]">
                  Transcript
                </div>
                <div className="text-xs text-[var(--text-color-dim)]">
                  Highlighted rows are the segments currently visible in the
                  waveform viewport.
                </div>
              </div>
              <div className="text-right text-xs text-[var(--text-color-dim)]">
                {viewportRange.end > viewportRange.start ? (
                  <>
                    <div>{formatSeconds(viewportRange.start)}</div>
                    <div>{formatSeconds(viewportRange.end)}</div>
                  </>
                ) : (
                  <div>Scroll the waveform</div>
                )}
              </div>
            </div>

            <div
              ref={transcriptScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
            >
              {transcriptItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--color_base_border)] bg-[var(--body-background)] p-4 text-sm text-[var(--text-color-dim)]">
                  Story rows will appear here once the bulk audio editor has
                  audio-capable lines.
                </div>
              ) : (
                <div className="space-y-3">
                  {transcriptItems.map((item, index) => {
                    const matchedSegment = sortedSegments[index];
                    const isVisible = visibleSegmentIndexes.has(index);
                    const isSelected = selectedSegmentIndex === index;
                    const wordMarks = matchedSegment
                      ? (wordMarksBySegmentId[matchedSegment.id] ?? [])
                      : [];
                    const activeWordIndex = matchedSegment
                      ? (activeWordIndexBySegmentId[matchedSegment.id] ?? -1)
                      : -1;
                    const skippedDuration = matchedSegment
                      ? getTotalRangeDuration(matchedSegment.skipRanges)
                      : 0;
                    const segmentDuration = matchedSegment
                      ? Math.max(
                          matchedSegment.end - matchedSegment.start,
                          0.001,
                        )
                      : 0.001;
                    const cardClassName = `rounded-[20px] border px-4 py-3 text-left transition-colors ${
                      isVisible
                        ? "border-[#d7e34f] bg-[#f8fbcf]"
                        : isSelected
                          ? "border-[#1cb0f6] bg-[rgba(28,176,246,0.08)]"
                          : "border-[var(--color_base_border)] bg-[var(--body-background)]"
                    }`;

                    return (
                      <div
                        key={item.id}
                        ref={(node) => {
                          transcriptRowRefs.current[index] = node;
                        }}
                        className={cardClassName}
                        onMouseEnter={() => {
                          if (!matchedSegment) return;
                          setHoveredSegmentId(matchedSegment.id);
                          setSelectedSegmentId(matchedSegment.id);
                        }}
                      >
                        <div
                          className="block w-full text-left"
                          role="button"
                          tabIndex={matchedSegment ? 0 : -1}
                          onClick={() => {
                            if (!matchedSegment) return;
                            onPlaySegment(matchedSegment);
                          }}
                          onKeyDown={(event) => {
                            if (!matchedSegment) return;
                            if (event.key !== "Enter" && event.key !== " ") {
                              return;
                            }
                            event.preventDefault();
                            onPlaySegment(matchedSegment);
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                                isVisible
                                  ? "border-[#c8d339] bg-[#ffffff] text-[#465100]"
                                  : "border-[var(--color_base_border)] bg-[var(--body-background-faint)] text-[var(--text-color)]"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-4">
                                <span className="shrink-0 text-[1.05rem] font-bold text-[var(--text-color)] md:min-w-[120px] md:text-right">
                                  {item.speaker || "Narrator"}:
                                </span>
                                <span className="text-[1.05rem] leading-8 text-[var(--text-color)]">
                                  {renderTextWithHighlightedWord(
                                    item.content.text,
                                    wordMarks,
                                    activeWordIndex,
                                    matchedSegment
                                      ? (markIndex) => {
                                          onPlayApproximateWord(
                                            matchedSegment,
                                            wordMarks,
                                            markIndex,
                                          );
                                        }
                                      : undefined,
                                  )}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-color-dim)]">
                                <span>Story line {item.lineIndex}</span>
                                {matchedSegment ? (
                                  <span>
                                    {formatSeconds(matchedSegment.start)} to{" "}
                                    {formatSeconds(matchedSegment.end)}
                                  </span>
                                ) : (
                                  <span>No matching segment yet</span>
                                )}
                                {matchedSegment && skippedDuration > 0 ? (
                                  <span>
                                    trims {formatSeconds(skippedDuration)}{" "}
                                    across {matchedSegment.skipRanges.length}{" "}
                                    pause
                                    {matchedSegment.skipRanges.length === 1
                                      ? ""
                                      : "s"}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="shrink-0 text-right font-mono text-sm font-bold text-[var(--text-color)]">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                        {matchedSegment && wordMarks.length > 0 ? (
                          <>
                            <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-[var(--text-color-dim)]">
                              <span>Word timing</span>
                              <span>
                                Drag markers or click a word above to play it.
                              </span>
                            </div>
                            <div
                              ref={(node) => {
                                wordTimelineRefs.current[matchedSegment.id] =
                                  node;
                              }}
                              className="relative mt-2 h-9 rounded-full border border-[var(--color_base_border)] bg-[var(--body-background)]"
                            >
                              {matchedSegment.skipRanges.map(
                                (skipRange, skipIndex) => {
                                  const leftPercent =
                                    ((skipRange.start - matchedSegment.start) /
                                      segmentDuration) *
                                    100;
                                  const widthPercent =
                                    ((skipRange.end - skipRange.start) /
                                      segmentDuration) *
                                    100;

                                  return (
                                    <div
                                      key={`${matchedSegment.id}-skip-${skipIndex}`}
                                      className="pointer-events-none absolute top-0 bottom-0 rounded-full border-x border-dashed border-[rgba(15,95,131,0.65)] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.08)_0_6px,rgba(15,95,131,0.18)_6px_12px)]"
                                      style={{
                                        left: `${leftPercent}%`,
                                        width: `${widthPercent}%`,
                                      }}
                                    />
                                  );
                                },
                              )}
                              {wordMarks.map((mark, markIndex) => {
                                const leftPercent =
                                  ((mark.time / 1000 - matchedSegment.start) /
                                    segmentDuration) *
                                  100;

                                return (
                                  <button
                                    key={`${matchedSegment.id}-marker-${mark.start}-${mark.time}`}
                                    type="button"
                                    className="absolute top-1/2 h-full w-4 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none"
                                    style={{
                                      left: `${leftPercent}%`,
                                    }}
                                    onPointerDown={(event) => {
                                      onStartWordMarkerDrag(
                                        event,
                                        matchedSegment.id,
                                        markIndex,
                                      );
                                    }}
                                    title={`Drag timing marker for "${mark.value}"`}
                                  >
                                    <span
                                      className={`absolute top-[15%] bottom-[15%] left-1/2 -translate-x-1/2 rounded-full ${
                                        markIndex === activeWordIndex
                                          ? "w-1 bg-[#d7e34f] shadow-[0_0_0_1px_rgba(70,81,0,0.28)]"
                                          : "w-px bg-[rgba(15,95,131,0.45)] shadow-[0_0_0_1px_rgba(255,255,255,0.18)]"
                                      }`}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color_base_border)] px-5 py-3">
        <div className="text-sm text-[var(--text-color-dim)]">
          {footerStatusText ??
            (segmentCountMismatch
              ? "Adjust the cuts until the segment count matches the number of bulk audio rows."
              : "Stage the generated clips into the bulk editor in top-to-bottom order.")}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-3 text-sm font-medium leading-none transition-colors hover:bg-[var(--color_base_background)]"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md border border-[#0f5f83] bg-[#1cb0f6] px-3 text-sm font-semibold leading-none text-white transition-colors hover:bg-[#1598d7] disabled:cursor-default disabled:opacity-70"
            onClick={onUseSegmentCuts}
            disabled={
              !audioBuffer ||
              segments.length === 0 ||
              segmentCountMismatch ||
              isExportingSegments
            }
          >
            {isExportingSegments
              ? (primaryActionPendingLabel ?? "Preparing MP3 clips...")
              : primaryActionLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (!renderInDialog) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-[var(--body-background)]">
        <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col">
          {content}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="inset-3 h-[calc(100vh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-none translate-x-0 translate-y-0 overflow-hidden p-0 sm:top-3 sm:left-3 sm:max-w-none sm:translate-x-0 sm:translate-y-0"
      >
        {content}
      </DialogContent>
    </Dialog>
  );
}
