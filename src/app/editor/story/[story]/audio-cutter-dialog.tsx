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

const DEFAULT_WAVEFORM_ZOOM = 180;
const MIN_WAVEFORM_ZOOM = 24;
const MAX_WAVEFORM_ZOOM = 420;
const WAVEFORM_ZOOM_STEP = 24;
const DEFAULT_SEGMENT_LENGTH_SECONDS = 1.8;
const MIN_SEGMENT_LENGTH_SECONDS = 0.25;
const MIN_PERSISTED_NEW_SEGMENT_SECONDS = 0.1;
const SILENCE_WINDOW_SECONDS = 0.02;
const DEFAULT_DETECTION_MIN_SILENCE_SECONDS = 1;
const DEFAULT_DETECTION_START_BUFFER_SECONDS = 0.04;
const DEFAULT_DETECTION_END_BUFFER_SECONDS = 0.04;
const SHRINK_WRAP_STABILITY_EPSILON_SECONDS = 0.01;
const MP3_BITRATE_KBPS = 128;
const MP3_SAMPLE_BLOCK_SIZE = 1152;
const SEGMENT_COLOR = "rgba(28,176,246,0.2)";
const SEGMENT_BORDER_COLOR = "rgba(15,95,131,0.4)";
const SEGMENT_ACTIVE_BORDER_COLOR = "rgba(28,176,246,0.95)";
const cachedAudioSegmentation = new WeakMap<
  AudioBuffer,
  Map<string, CachedAudioSegmentation>
>();

type Segment = {
  id: string;
  start: number;
  end: number;
  label?: string;
};

type TranscriptItem = {
  id: string;
  order: number;
  lineIndex: number;
  type: "HEADER" | "LINE";
  speaker: string;
  content: {
    text: string;
  };
};

type MergePreview = {
  activeId: string;
  targetId: string;
};

type SegmentDraft = {
  start: number;
  end: number;
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

function getSegmentsFromPlugin(plugin: RegionsPlugin) {
  return sortSegments(
    plugin.getRegions().map((region) => ({
      id: region.id,
      start: region.start,
      end: region.end,
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
  };
}

function getDetectionSettingsCacheKey(settings: DetectionSettings) {
  return [
    settings.minSilenceSeconds.toFixed(3),
    settings.startBufferSeconds.toFixed(3),
    settings.endBufferSeconds.toFixed(3),
  ].join(":");
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
) {
  const { Mp3Encoder } = await getLamejsModule();
  const sampleRate = buffer.sampleRate;
  const channelCount = Math.min(2, Math.max(1, buffer.numberOfChannels));
  const startFrame = clamp(
    Math.floor(startSeconds * sampleRate),
    0,
    buffer.length,
  );
  const endFrame = clamp(
    Math.ceil(endSeconds * sampleRate),
    startFrame + 1,
    buffer.length,
  );
  const frameCount = Math.max(1, endFrame - startFrame);
  const encoder = new Mp3Encoder(channelCount, sampleRate, MP3_BITRATE_KBPS);
  const channelData = Array.from({ length: channelCount }, (_, index) =>
    buffer.getChannelData(index),
  );
  const mp3Chunks: Uint8Array[] = [];

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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renderInDialog?: boolean;
  expectedSegmentCount: number;
  transcriptItems: TranscriptItem[];
  onUseSegments: (files: File[]) => Promise<void> | void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const transcriptScrollRef = React.useRef<HTMLDivElement | null>(null);
  const transcriptRowRefs = React.useRef<
    Record<number, HTMLButtonElement | null>
  >({});
  const isSyncingRegionsRef = React.useRef(false);
  const activeDraftRegionIdRef = React.useRef<string | null>(null);
  const pendingRegionIdsRef = React.useRef<Set<string>>(new Set());
  const autoDetectRequestRef = React.useRef(0);
  const lastHandledAutoDetectRequestRef = React.useRef(0);
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
  const [selectedSegmentId, setSelectedSegmentId] = React.useState<
    string | null
  >(null);
  const regionsPlugin = React.useMemo(() => Regions.create(), []);
  const typedRegionsPlugin = regionsPlugin as unknown as RegionsPlugin;
  const sortedSegments = React.useMemo(
    () => sortSegments(segments),
    [segments],
  );

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
    plugins: React.useMemo(() => [regionsPlugin], [regionsPlugin]),
  });

  const resetState = React.useCallback(() => {
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
    setAudioBuffer(null);
    setSegments([]);
    setLabelsById({});
    setMergePreview(null);
    setDuration(0);
    setViewportRange({ start: 0, end: 0 });
    setWaveformReady(false);
    setHoveredSegmentId(null);
    setZoomPxPerSec(DEFAULT_WAVEFORM_ZOOM);
    setSelectedSegmentId(null);
    autoDetectRequestRef.current = 0;
    lastHandledAutoDetectRequestRef.current = 0;
    setAudioUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return "";
    });
  }, [typedRegionsPlugin]);

  React.useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  React.useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

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
            return {
              ...segment,
              start: nextBounds.start,
              end: nextBounds.end,
            };
          }),
        ),
      );
      setHoveredSegmentId(segmentId);
      setSelectedSegmentId(segmentId);
    },
    [audioBuffer, detectionSettings],
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
          return {
            ...segment,
            start: nextBounds.start,
            end: nextBounds.end,
          };
        }),
      ),
    );
  }, [audioBuffer, detectionSettings]);

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
        next.push({
          id: survivingId,
          start: mergedStart,
          end: mergedEnd,
        });
        return sortSegments(next);
      });
      setHoveredSegmentId(survivingId);
      setSelectedSegmentId(survivingId);
    },
    [labelsById, segments],
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
              if (!wavesurfer) return;
              void wavesurfer.play(segment.start, segment.end);
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
        }
      });
    },
    [
      labelsById,
      mergePreview?.activeId,
      mergePreview?.targetId,
      onEditSegmentLabel,
      onRemoveSegment,
      onShrinkWrapSegment,
      hoveredSegmentId,
      selectedSegmentId,
      segments,
      wavesurfer,
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

    updateViewportRange();
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    resizeObserver.observe(scrollContainer);

    return () => {
      scrollContainer.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
    };
  }, [updateViewportRange, wavesurfer]);

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
    const activeIndexes = [...visibleSegmentIndexes].sort(
      (left, right) => left - right,
    );
    const firstActiveIndex = activeIndexes[0];
    if (firstActiveIndex === undefined) return;

    const transcriptScroll = transcriptScrollRef.current;
    const transcriptRow = transcriptRowRefs.current[firstActiveIndex];
    if (!transcriptScroll || !transcriptRow) return;

    const rowTop = transcriptRow.offsetTop;
    const rowBottom = rowTop + transcriptRow.offsetHeight;
    const viewportTop = transcriptScroll.scrollTop;
    const viewportBottom = viewportTop + transcriptScroll.clientHeight;

    if (rowTop >= viewportTop && rowBottom <= viewportBottom) return;

    transcriptRow.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [visibleSegmentIndexes]);

  React.useEffect(() => {
    syncRegionsFromState(typedRegionsPlugin);
  }, [syncRegionsFromState, typedRegionsPlugin]);

  React.useEffect(() => {
    syncRegionAppearance(typedRegionsPlugin);
  }, [syncRegionAppearance, typedRegionsPlugin]);

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
            {
              id: region.id,
              start: region.start,
              end: region.end,
            },
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
                ? {
                    ...segment,
                    start: region.start,
                    end: region.end,
                  }
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
    mergeOverlappingRegions,
    pendingRegionTouchesCommittedSegment,
    segments,
    syncRegionAppearance,
    typedRegionsPlugin,
    wavesurfer,
  ]);

  const replaceSegments = React.useCallback((nextSegments: SegmentDraft[]) => {
    activeDraftRegionIdRef.current = null;
    pendingRegionIdsRef.current.clear();
    setMergePreview(null);
    const next = sortSegments(
      nextSegments.map((segment) => ({
        id: createSegmentId(),
        start: segment.start,
        end: segment.end,
      })),
    );
    setSegments(next);
    setSelectedSegmentId(next[0]?.id ?? null);
  }, []);

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
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      const requestToken = autoDetectRequestRef.current + 1;
      autoDetectRequestRef.current = requestToken;
      setIsLoadingAudio(true);
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

  const onNormalizeAudio = React.useCallback(async () => {
    if (!audioBuffer || isNormalizingAudio) return;

    setIsNormalizingAudio(true);
    setAudioError(null);
    setExportError(null);

    try {
      const normalized = normalizeAudioBufferPeak(audioBuffer);
      if (normalized.changed) {
        updateLoadedAudio(normalized.buffer);
      }
    } catch (error) {
      setAudioError(
        getErrorMessage(error, "Could not normalize the loaded audio."),
      );
    } finally {
      setIsNormalizingAudio(false);
    }
  }, [audioBuffer, isNormalizingAudio, updateLoadedAudio]);

  const onPlayPause = React.useCallback(() => {
    wavesurfer?.playPause();
  }, [wavesurfer]);

  const onPlaySegment = React.useCallback(
    (segment: Segment) => {
      setSelectedSegmentId(segment.id);
      if (!wavesurfer) return;
      void wavesurfer.play(segment.start, segment.end);
    },
    [wavesurfer],
  );

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

      await onUseSegments(files);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to prepare segment cuts", error);
      setExportError(
        `Could not prepare MP3 clips for staging: ${getErrorMessage(
          error,
          "Unknown error.",
        )}`,
      );
    } finally {
      setIsExportingSegments(false);
    }
  }, [createSegmentFiles, isExportingSegments, onOpenChange, onUseSegments]);

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
    replaceSegments(detectSpeechSegments(audioBuffer, nextSettings));
  }, [audioBuffer, detectionForm, replaceSegments]);

  const content = (
    <div
      className={
        renderInDialog
          ? "flex h-full min-w-[1080px] flex-col bg-[var(--body-background)]"
          : "flex min-h-full w-full flex-col bg-[var(--body-background)]"
      }
    >
      <div className="border-b border-[var(--color_base_border)] px-5 py-4">
        {renderInDialog ? (
          <>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-[var(--text-color)]">
              <ScissorsIcon className="h-5 w-5 text-[#0f5f83]" />
              Audio cutter
            </DialogTitle>
            <DialogDescription className="mt-1 max-w-[85ch] text-sm text-[var(--text-color-dim)]">
              Load one long recording, auto-detect speech blocks between
              silences, then drag the start and end edges until the cuts line
              up. Drag on the waveform to add extra segments manually.
            </DialogDescription>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-[1.4rem] font-semibold text-[var(--text-color)]">
              <ScissorsIcon className="h-6 w-6 text-[#0f5f83]" />
              <h1>Audio cutter</h1>
            </div>
            <p className="mt-1 max-w-[90ch] text-sm text-[var(--text-color-dim)]">
              Load one long recording, auto-detect speech blocks between
              silences, then drag the start and end edges until the cuts line
              up. Drag on the waveform to add extra segments manually.
            </p>
          </>
        )}
      </div>

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
          disabled={!audioBuffer || isNormalizingAudio}
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
          onChange={onFileChange}
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
            around each detected block.
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
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-xs text-[var(--text-color-dim)]">
              Current: split after {detectionSettings.minSilenceSeconds}s of
              silence, with +{detectionSettings.startBufferSeconds}s / +
              {detectionSettings.endBufferSeconds}s buffer.
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

      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1.65fr)_360px]">
        <div className="flex min-h-0 flex-col overflow-hidden border-r border-[var(--color_base_border)] px-5 py-4">
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
            <div className="text-right text-xs text-[var(--text-color-dim)]">
              <div>{segments.length} segment(s)</div>
              <div>{duration > 0 ? formatSeconds(duration) : "00:00.000"}</div>
            </div>
          </div>
          <div
            ref={scrollContainerRef}
            className="h-fit overflow-x-auto overflow-y-hidden rounded-xl border border-[var(--color_base_border)] bg-[linear-gradient(180deg,rgba(28,176,246,0.05),rgba(15,95,131,0.02))] p-4"
          >
            <div ref={containerRef} />
          </div>
          {audioError ? (
            <p className="mt-3 text-sm text-[#b33b3b]">{audioError}</p>
          ) : null}
          {exportError ? (
            <p className="mt-3 text-sm text-[#b33b3b]">{exportError}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--text-color-dim)]">
            <div>
              {segmentCountMismatch
                ? `${segments.length} segments detected for ${expectedSegmentCount} story rows.`
                : expectedSegmentCount > 0
                  ? `${segments.length} / ${expectedSegmentCount} segments ready for staging.`
                  : `${segments.length} segments ready.`}
            </div>
            {segments.length > 0 ? (
              <button
                type="button"
                className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-2 leading-none transition-colors hover:bg-[var(--color_base_background)]"
                onClick={onClearSegments}
              >
                Clear segments
              </button>
            ) : null}
          </div>

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

                    return (
                      <button
                        key={item.id}
                        ref={(node) => {
                          transcriptRowRefs.current[index] = node;
                        }}
                        type="button"
                        className={`block w-full rounded-[20px] border px-4 py-3 text-left transition-colors ${
                          isVisible
                            ? "border-[#d7e34f] bg-[#f8fbcf]"
                            : isSelected
                              ? "border-[#1cb0f6] bg-[rgba(28,176,246,0.08)]"
                              : "border-[var(--color_base_border)] bg-[var(--body-background)] hover:bg-[var(--color_base_background)]"
                        }`}
                        onClick={() => {
                          if (!matchedSegment) return;
                          onPlaySegment(matchedSegment);
                        }}
                        onMouseEnter={() => {
                          if (!matchedSegment) return;
                          setHoveredSegmentId(matchedSegment.id);
                          setSelectedSegmentId(matchedSegment.id);
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
                                {item.content.text}
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
                            </div>
                          </div>
                          <div className="shrink-0 text-right font-mono text-sm font-bold text-[var(--text-color)]">
                            #{index + 1}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-5 py-4">
          <div className="mb-3">
            <div className="text-sm font-semibold text-[var(--text-color)]">
              Segment list
            </div>
            <div className="text-xs text-[var(--text-color-dim)]">
              Use this list to audition and remove cuts. The order here is the
              order that will be staged into the bulk editor.
            </div>
          </div>

          {segments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color_base_border)] bg-[var(--body-background-faint)] p-4 text-sm text-[var(--text-color-dim)]">
              Upload a recording to auto-detect cuts, or drag across the
              waveform to create them yourself.
            </div>
          ) : (
            <div className="space-y-3">
              {segments.map((segment, index) => {
                const isSelected = selectedSegmentId === segment.id;
                const onPlay = () => onPlaySegment(segment);
                const onShrinkWrap = () => onShrinkWrapSegment(segment.id);
                const onEditLabel = () => onEditSegmentLabel(segment.id);
                const onDelete = () => onRemoveSegment(segment.id);
                return (
                  <div
                    key={segment.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      isSelected
                        ? "border-[#1cb0f6] bg-[rgba(28,176,246,0.08)]"
                        : "border-[var(--color_base_border)] bg-[var(--body-background-faint)]"
                    }`}
                    onMouseEnter={() => {
                      setHoveredSegmentId(segment.id);
                      setSelectedSegmentId(segment.id);
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-color)]">
                          Segment {index + 1}
                        </div>
                        {labelsById[segment.id] ? (
                          <div className="mt-0.5 text-xs font-medium text-[#0f5f83]">
                            {labelsById[segment.id]}
                          </div>
                        ) : null}
                        <div className="text-xs text-[var(--text-color-dim)]">
                          {formatSeconds(segment.start)} to{" "}
                          {formatSeconds(segment.end)}
                        </div>
                      </div>
                      <div className="text-xs text-[var(--text-color-dim)]">
                        {formatSeconds(segment.end - segment.start)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background)] px-2 text-xs font-medium leading-none transition-colors hover:bg-[var(--color_base_background)]"
                        onClick={onPlay}
                      >
                        Play
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background)] px-2 text-xs font-medium leading-none transition-colors hover:bg-[var(--color_base_background)]"
                        onClick={onShrinkWrap}
                      >
                        Shrink-wrap
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background)] px-2 text-xs font-medium leading-none transition-colors hover:bg-[var(--color_base_background)]"
                        onClick={onEditLabel}
                        title={
                          labelsById[segment.id] ? "Edit label" : "Add label"
                        }
                      >
                        {labelsById[segment.id] ? "Edit label" : "Add label"}
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-[var(--color_base_border)] bg-[var(--body-background)] px-2 text-xs font-medium leading-none text-[#b33b3b] transition-colors hover:bg-[#fff5f5]"
                        onClick={onDelete}
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color_base_border)] px-5 py-3">
        <div className="text-sm text-[var(--text-color-dim)]">
          {segmentCountMismatch
            ? "Adjust the cuts until the segment count matches the number of bulk audio rows."
            : "Stage the generated clips into the bulk editor in top-to-bottom order."}
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
              ? "Preparing MP3 clips..."
              : "Use segments in bulk editor"}
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
