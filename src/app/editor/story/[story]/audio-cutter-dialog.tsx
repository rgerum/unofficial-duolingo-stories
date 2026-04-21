"use client";

import React from "react";
import { zipSync } from "fflate";
import { useWavesurfer } from "@wavesurfer/react";
import {
  DownloadIcon,
  PlusIcon,
  ScissorsIcon,
  Trash2Icon,
  UploadIcon,
  WandSparklesIcon,
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import Regions from "wavesurfer.js/dist/plugins/regions.js";
import PlayAudio from "@/components/PlayAudio";
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
const SILENCE_EDGE_PADDING_SECONDS = 0.04;
const SHRINK_WRAP_STABILITY_EPSILON_SECONDS = 0.01;
const MP3_BITRATE_KBPS = 128;
const MP3_SAMPLE_BLOCK_SIZE = 1152;
const SEGMENT_COLOR = "rgba(28,176,246,0.2)";
const SEGMENT_BORDER_COLOR = "rgba(15,95,131,0.4)";
const SEGMENT_ACTIVE_BORDER_COLOR = "rgba(28,176,246,0.95)";
const SEGMENT_TEXT_BACKGROUND = "rgba(15,95,131,0.92)";

type Segment = {
  id: string;
  start: number;
  end: number;
  label?: string;
};

type MergePreview = {
  activeId: string;
  targetId: string;
};

type SegmentDraft = {
  start: number;
  end: number;
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

function createSegmentId() {
  return `segment-${Math.random().toString(36).slice(2, 10)}`;
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

function analyzeAudioSilence(buffer: AudioBuffer) {
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
    paddingSeconds: SILENCE_EDGE_PADDING_SECONDS,
    threshold: clamp(
      Math.max(floorLevel * 3, peakLevel * 0.045, 0.008),
      0.008,
      Math.max(0.015, peakLevel * 0.5),
    ),
    windowSeconds,
    minSilenceWindows: Math.max(2, Math.round(0.28 / windowSeconds)),
    minSpeechWindows: Math.max(2, Math.round(0.18 / windowSeconds)),
  };
}

function getShrinkWrappedSegment(
  buffer: AudioBuffer,
  segment: { start: number; end: number },
) {
  const duration = segment.end - segment.start;
  if (duration <= MIN_SEGMENT_LENGTH_SECONDS) {
    return segment;
  }

  const matchingDetectedSegment = detectSpeechSegments(buffer).find(
    (candidate) =>
      Math.abs(candidate.start - segment.start) <=
        SHRINK_WRAP_STABILITY_EPSILON_SECONDS &&
      Math.abs(candidate.end - segment.end) <=
        SHRINK_WRAP_STABILITY_EPSILON_SECONDS,
  );
  if (matchingDetectedSegment) {
    return segment;
  }

  const { levels, paddingSeconds, threshold, windowSeconds } =
    analyzeAudioSilence(buffer);
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
    firstActiveWindow * windowSeconds - paddingSeconds,
  );
  const rawNextEnd = Math.min(
    segment.end,
    (lastActiveWindow + 1) * windowSeconds + paddingSeconds,
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
  button.ariaLabel = title;
  button.style.display = "inline-flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.width = "22px";
  button.style.height = "22px";
  button.style.borderRadius = "9999px";
  button.style.border = "1px solid rgba(255,255,255,0.24)";
  button.style.background = danger
    ? "rgba(179,59,59,0.9)"
    : "rgba(15,95,131,0.9)";
  button.style.color = "#fff";
  button.style.cursor = "pointer";
  button.style.padding = "0";
  button.style.pointerEvents = "auto";

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
  wrapper.style.position = "absolute";
  wrapper.style.left = "8px";
  wrapper.style.top = "6px";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "flex-start";
  wrapper.style.gap = "4px";
  wrapper.style.maxWidth = "calc(100% - 16px)";
  wrapper.style.pointerEvents = "none";

  const topRow = document.createElement("div");
  topRow.style.display = "inline-flex";
  topRow.style.alignItems = "center";
  topRow.style.gap = "6px";
  topRow.style.maxWidth = "100%";
  wrapper.append(topRow);

  const badge = document.createElement("div");
  badge.textContent = `${index + 1}`;
  badge.style.display = "inline-flex";
  badge.style.alignItems = "center";
  badge.style.justifyContent = "center";
  badge.style.minWidth = "22px";
  badge.style.height = "22px";
  badge.style.padding = "0 7px";
  badge.style.borderRadius = "9999px";
  badge.style.background = SEGMENT_TEXT_BACKGROUND;
  badge.style.color = "#fff";
  badge.style.fontSize = "11px";
  badge.style.fontWeight = "700";
  badge.style.lineHeight = "1";
  badge.style.flexShrink = "0";
  topRow.append(badge);

  if (showControls) {
    const controls = document.createElement("div");
    controls.style.display = "inline-flex";
    controls.style.alignItems = "center";
    controls.style.gap = "4px";
    controls.style.pointerEvents = "auto";

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
    labelElement.style.maxWidth = "120px";
    labelElement.style.padding = "2px 8px";
    labelElement.style.borderRadius = "9999px";
    labelElement.style.background = "rgba(255,255,255,0.92)";
    labelElement.style.color = "#0f5f83";
    labelElement.style.fontSize = "11px";
    labelElement.style.fontWeight = "600";
    labelElement.style.lineHeight = "1.2";
    labelElement.style.whiteSpace = "nowrap";
    labelElement.style.overflow = "hidden";
    labelElement.style.textOverflow = "ellipsis";
    labelElement.style.pointerEvents = "none";
    topRow.append(labelElement);
  }

  if (showJoinHint) {
    const joinHint = document.createElement("div");
    joinHint.textContent = "join segments";
    joinHint.style.padding = "2px 8px";
    joinHint.style.borderRadius = "9999px";
    joinHint.style.background = "rgba(255,255,255,0.95)";
    joinHint.style.color = "#0f5f83";
    joinHint.style.fontSize = "11px";
    joinHint.style.fontWeight = "700";
    joinHint.style.lineHeight = "1.2";
    joinHint.style.textTransform = "lowercase";
    joinHint.style.pointerEvents = "none";
    wrapper.append(joinHint);
  }

  return wrapper;
}

function detectSpeechSegments(buffer: AudioBuffer): SegmentDraft[] {
  const {
    duration,
    levels,
    minSilenceWindows,
    minSpeechWindows,
    paddingSeconds,
    threshold,
    windowSeconds,
  } = analyzeAudioSilence(buffer);

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
        start: Math.max(0, speechStartWindow * windowSeconds - paddingSeconds),
        end: Math.min(
          duration,
          lastLoudWindow * windowSeconds + windowSeconds + paddingSeconds,
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
      start: Math.max(0, speechStartWindow * windowSeconds - paddingSeconds),
      end: Math.min(
        duration,
        lastLoudWindow * windowSeconds + windowSeconds + paddingSeconds,
      ),
    });
  }

  return segments.reduce<SegmentDraft[]>((acc, segment) => {
    const previous = acc[acc.length - 1];
    if (!previous) {
      acc.push(segment);
      return acc;
    }

    if (segment.start - previous.end < 0.14) {
      previous.end = Math.max(previous.end, segment.end);
      return acc;
    }

    acc.push(segment);
    return acc;
  }, []);
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

async function decodeAudioFile(file: File) {
  const audioContext = new AudioContext({ latencyHint: "interactive" });
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    return decoded;
  } finally {
    await audioContext.close();
  }
}

function getRegionsPlugin(wavesurfer: WaveSurfer | null | undefined) {
  return (
    (wavesurfer as unknown as { plugins?: RegionsPlugin[] } | null)
      ?.plugins?.[0] ?? null
  );
}

export default function AudioCutterDialog({
  open,
  onOpenChange,
  expectedSegmentCount,
  onUseSegments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedSegmentCount: number;
  onUseSegments: (files: File[]) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
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
  const [isLoadingAudio, setIsLoadingAudio] = React.useState(false);
  const [isExportingSegments, setIsExportingSegments] = React.useState(false);
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
  const [hoveredSegmentId, setHoveredSegmentId] = React.useState<string | null>(
    null,
  );
  const [selectedSegmentId, setSelectedSegmentId] = React.useState<
    string | null
  >(null);

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
    plugins: React.useMemo(() => [Regions.create()], []),
  });

  const resetState = React.useCallback(() => {
    activeDraftRegionIdRef.current = null;
    pendingRegionIdsRef.current.clear();
    getRegionsPlugin(wavesurfer)?.clearRegions();
    setAudioFile(null);
    setAudioError(null);
    setAudioBuffer(null);
    setSegments([]);
    setLabelsById({});
    setMergePreview(null);
    setDuration(0);
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
  }, [wavesurfer]);

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
            const nextBounds = getShrinkWrappedSegment(audioBuffer, segment);
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
    [audioBuffer],
  );

  const onShrinkWrapAll = React.useCallback(() => {
    if (!audioBuffer) return;
    setSegments((current) =>
      sortSegments(
        current.map((segment) => {
          const nextBounds = getShrinkWrappedSegment(audioBuffer, segment);
          return {
            ...segment,
            start: nextBounds.start,
            end: nextBounds.end,
          };
        }),
      ),
    );
  }, [audioBuffer]);

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

  React.useEffect(() => {
    const plugin = getRegionsPlugin(wavesurfer);
    if (!plugin) return;
    syncRegionsFromState(plugin);
  }, [syncRegionsFromState, wavesurfer]);

  React.useEffect(() => {
    const plugin = getRegionsPlugin(wavesurfer);
    if (!plugin) return;
    syncRegionAppearance(plugin);
  }, [syncRegionAppearance, wavesurfer]);

  React.useEffect(() => {
    if (!wavesurfer) return;
    const plugin = getRegionsPlugin(wavesurfer);
    if (!plugin) return;

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
    replaceSegments(detectSpeechSegments(audioBuffer));
  }, [audioBuffer, replaceSegments]);

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

  const onFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      setIsLoadingAudio(true);
      setAudioError(null);
      setAudioFile(file);
      setWaveformReady(false);
      activeDraftRegionIdRef.current = null;
      pendingRegionIdsRef.current.clear();
      setSelectedSegmentId(null);
      setSegments([]);
      setLabelsById({});
      setMergePreview(null);
      setDuration(0);
      getRegionsPlugin(wavesurfer)?.clearRegions();

      setAudioUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return URL.createObjectURL(file);
      });

      try {
        const decoded = await decodeAudioFile(file);
        setAudioBuffer(decoded);
        autoDetectRequestRef.current += 1;
      } catch (error) {
        setAudioBuffer(null);
        setAudioError(
          error instanceof Error && error.message
            ? error.message
            : "Could not read the selected audio file.",
        );
      } finally {
        setIsLoadingAudio(false);
      }
    },
    [wavesurfer],
  );

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

  const onAddSegment = React.useCallback(() => {
    if (!wavesurfer) return;

    const currentTime = wavesurfer.getCurrentTime();
    const maxEnd = wavesurfer.getDuration();
    const start = clamp(
      currentTime,
      0,
      Math.max(0, maxEnd - DEFAULT_SEGMENT_LENGTH_SECONDS),
    );
    const end = clamp(
      start + DEFAULT_SEGMENT_LENGTH_SECONDS,
      start + MIN_SEGMENT_LENGTH_SECONDS,
      maxEnd,
    );

    const segmentId = createSegmentId();
    setSegments((current) =>
      sortSegments([
        ...current,
        {
          id: segmentId,
          start,
          end,
        },
      ]),
    );
    setSelectedSegmentId(segmentId);
  }, [wavesurfer]);

  const onClearSegments = React.useCallback(() => {
    activeDraftRegionIdRef.current = null;
    pendingRegionIdsRef.current.clear();
    const plugin = getRegionsPlugin(wavesurfer);
    plugin?.clearRegions();
    setSegments([]);
    setLabelsById({});
    setMergePreview(null);
    setSelectedSegmentId(null);
  }, [wavesurfer]);

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
    } finally {
      setIsExportingSegments(false);
    }
  }, [audioFile?.name, createSegmentFiles, isExportingSegments]);

  const onUseSegmentCuts = React.useCallback(async () => {
    if (isExportingSegments) return;

    setIsExportingSegments(true);
    try {
      const files = await createSegmentFiles();
      if (!files || files.length === 0) return;

      onUseSegments(files);
      onOpenChange(false);
    } finally {
      setIsExportingSegments(false);
    }
  }, [createSegmentFiles, isExportingSegments, onOpenChange, onUseSegments]);

  const segmentCountMismatch =
    expectedSegmentCount > 0 && segments.length !== expectedSegmentCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="inset-3 h-[calc(100vh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-none translate-x-0 translate-y-0 overflow-hidden p-0 sm:top-3 sm:left-3 sm:max-w-none sm:translate-x-0 sm:translate-y-0"
      >
        <div className="flex h-full min-w-[1080px] flex-col bg-[var(--body-background)]">
          <div className="border-b border-[var(--color_base_border)] px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-[var(--text-color)]">
              <ScissorsIcon className="h-5 w-5 text-[#0f5f83]" />
              Audio cutter
            </DialogTitle>
            <DialogDescription className="mt-1 max-w-[85ch] text-sm text-[var(--text-color-dim)]">
              Load one long recording, auto-detect speech blocks between
              silences, then drag the start and end edges until the cuts line
              up. Drag on the waveform to add extra segments manually.
            </DialogDescription>
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
              onClick={runAutoDetect}
              disabled={!audioBuffer}
              title={
                audioBuffer
                  ? "Rebuild segments from silence"
                  : "Load audio first"
              }
            >
              <WandSparklesIcon className="h-4 w-4" />
              Detect silence
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-3 text-sm font-medium leading-none transition-colors hover:bg-[var(--color_base_background)] disabled:cursor-default disabled:opacity-70"
              onClick={onAddSegment}
              disabled={!waveformReady}
            >
              <PlusIcon className="h-4 w-4" />
              Add segment
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

          <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1.65fr)_360px]">
            <div className="min-h-0 border-r border-[var(--color_base_border)] px-5 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--text-color)]">
                    Waveform
                  </div>
                  <div className="text-xs text-[var(--text-color-dim)]">
                    Drag across the waveform to add a segment. Drag a segment
                    body to move it. Drag either edge to resize it.
                  </div>
                </div>
                <div className="text-right text-xs text-[var(--text-color-dim)]">
                  <div>{segments.length} segment(s)</div>
                  <div>
                    {duration > 0 ? formatSeconds(duration) : "00:00.000"}
                  </div>
                </div>
              </div>
              <div
                ref={scrollContainerRef}
                className="h-[320px] overflow-x-auto overflow-y-hidden rounded-xl border border-[var(--color_base_border)] bg-[linear-gradient(180deg,rgba(28,176,246,0.05),rgba(15,95,131,0.02))] p-4"
              >
                <div ref={containerRef} />
              </div>
              {audioError ? (
                <p className="mt-3 text-sm text-[#b33b3b]">{audioError}</p>
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
            </div>

            <div className="min-h-0 overflow-y-auto px-5 py-4">
              <div className="mb-3">
                <div className="text-sm font-semibold text-[var(--text-color)]">
                  Segment list
                </div>
                <div className="text-xs text-[var(--text-color-dim)]">
                  Use this list to audition and remove cuts. The order here is
                  the order that will be staged into the bulk editor.
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
                            onClick={() => onPlaySegment(segment)}
                          >
                            Play
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background)] px-2 text-xs font-medium leading-none transition-colors hover:bg-[var(--color_base_background)]"
                            onClick={() => onShrinkWrapSegment(segment.id)}
                          >
                            Shrink-wrap
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-[var(--color_base_border)] bg-[var(--body-background)] px-2 text-xs font-medium leading-none text-[#b33b3b] transition-colors hover:bg-[#fff5f5]"
                            onClick={() => onRemoveSegment(segment.id)}
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
      </DialogContent>
    </Dialog>
  );
}
