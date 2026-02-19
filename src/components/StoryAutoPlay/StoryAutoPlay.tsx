"use client";
import React from "react";
import styles from "./StoryAutoPlay.module.css";
import StoryTextLine from "../StoryTextLine";
import StoryHeader from "../StoryHeader";
import StoryHeaderProgress from "../StoryHeaderProgress";
import Legal from "../layout/legal";
import type { StoryType } from "@/components/editor/story/syntax_parser_new";
import type {
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";

interface StoryAutoPlayProps {
  story: StoryType & {
    id: number;
    learning_language_rtl?: boolean;
    learning_language?: string;
    from_language?: string;
    course_short?: string;
  };
}

const BLOB_PUBLIC_BASE =
  "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/";
const FETCH_RETRIES = 2;
const LARGE_MERGE_SEGMENT_THRESHOLD = 60;

const autoPlaySettings = {
  hide_questions: true,
  show_all: true,
  show_names: false,
  rtl: false,
  highlight_name: [],
  hideNonHighlighted: false,
  setHighlightName: () => {},
  setHideNonHighlighted: () => {},
  id: 0,
  show_title_page: false,
};

type AutoPlayableElement = StoryElementHeader | StoryElementLine;

type TimelineSegment = {
  lineIndex: number;
  audioUrl: string;
  displayElement: AutoPlayableElement;
  keypoints?: { rangeEnd: number; audioStart: number }[];
};

type TimelineMeta = {
  lineIndex: number;
  start: number;
  duration: number;
  keypoints?: { rangeEnd: number; audioStart: number }[];
};

function getParts(story: StoryType) {
  const parts: StoryElement[][] = [];
  let lastId = -1;
  for (const element of story.elements) {
    if (element.trackingProperties === undefined) continue;
    if (lastId !== element.trackingProperties.line_index) {
      parts.push([]);
      lastId = element.trackingProperties.line_index;
    }
    parts[parts.length - 1].push(element);
  }
  return parts;
}

function toAbsoluteAudioUrl(url: string): string | null {
  if (url.startsWith("blob:")) return url;
  if (/^https?:\/\//.test(url)) return url;
  return `${BLOB_PUBLIC_BASE}${url.replace(/^\/+/, "")}`;
}

function getElementAudioUrl(element: AutoPlayableElement): string | null {
  const url =
    element.type === "HEADER"
      ? element.learningLanguageTitleContent?.audio?.url
      : element.line?.content?.audio?.url;
  if (!url) return null;
  return toAbsoluteAudioUrl(url);
}

function getElementKeypoints(
  element: AutoPlayableElement,
): { rangeEnd: number; audioStart: number }[] | undefined {
  const points =
    element.type === "HEADER"
      ? element.learningLanguageTitleContent?.audio?.keypoints
      : element.line?.content?.audio?.keypoints;
  return points?.length ? points : undefined;
}

function clearHints(element: StoryElement): StoryElement {
  if (element.type === "LINE") {
    return {
      ...element,
      line: {
        ...element.line,
        content: {
          ...element.line.content,
          hintMap: [],
          hints_pronunciation: [],
          audio: undefined,
        },
      },
      audio: undefined,
    };
  }

  if (element.type === "HEADER") {
    return {
      ...element,
      learningLanguageTitleContent: {
        ...element.learningLanguageTitleContent,
        hintMap: [],
        hints_pronunciation: [],
        audio: undefined,
      },
      audio: undefined,
    };
  }

  return element;
}

function findSegmentIndexByTime(meta: TimelineMeta[], time: number): number {
  if (!meta.length) return -1;
  for (let i = meta.length - 1; i >= 0; i--) {
    if (time >= meta[i].start) return i;
  }
  return 0;
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function fetchArrayBufferWithRetry(url: string): Promise<ArrayBuffer> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Could not download audio (${response.status}).`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      lastError = error;
      if (attempt === FETCH_RETRIES) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Could not download audio after retries.");
}

function mergeBuffersToWav(buffers: AudioBuffer[]): Blob {
  if (!buffers.length) {
    return new Blob([], { type: "audio/wav" });
  }

  const sampleRate = buffers[0].sampleRate;
  for (let i = 1; i < buffers.length; i++) {
    if (buffers[i].sampleRate !== sampleRate) {
      throw new Error(
        `Mixed sample rates are not supported (${sampleRate} vs ${buffers[i].sampleRate}).`,
      );
    }
  }
  const channels = Math.max(...buffers.map((b) => b.numberOfChannels));
  const totalFrames = buffers.reduce((sum, b) => sum + b.length, 0);

  const mergedChannels = Array.from(
    { length: channels },
    () => new Float32Array(totalFrames),
  );

  let writeOffset = 0;
  for (const buffer of buffers) {
    for (let channel = 0; channel < channels; channel++) {
      const src = buffer.getChannelData(
        Math.min(channel, buffer.numberOfChannels - 1),
      );
      mergedChannels[channel].set(src, writeOffset);
    }
    writeOffset += buffer.length;
  }

  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalFrames * blockAlign;
  const output = new ArrayBuffer(44 + dataSize);
  const view = new DataView(output);

  let offset = 0;
  const writeStr = (text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset++, text.charCodeAt(i));
    }
  };

  writeStr("RIFF");
  // WAV/RIFF numeric fields are little-endian by specification.
  view.setUint32(offset, 36 + dataSize, true);
  offset += 4;
  writeStr("WAVE");
  writeStr("fmt ");
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
  writeStr("data");
  view.setUint32(offset, dataSize, true);
  offset += 4;

  for (let i = 0; i < totalFrames; i++) {
    for (let channel = 0; channel < channels; channel++) {
      const sample = Math.max(-1, Math.min(1, mergedChannels[channel][i]));
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

export default function StoryAutoPlay({ story }: StoryAutoPlayProps) {
  const parts = React.useMemo(() => getParts(story), [story]);
  const course =
    story.course_short ?? `${story.learning_language}-${story.from_language}`;

  const settings = {
    ...autoPlaySettings,
    rtl: story.learning_language_rtl ?? false,
  };

  const timelineSegments = React.useMemo(() => {
    const entries: TimelineSegment[] = [];
    for (const part of parts) {
      for (const element of part) {
        if (element.type !== "HEADER" && element.type !== "LINE") continue;

        const audioUrl = getElementAudioUrl(element);
        if (!audioUrl) continue;

        const keypoints = getElementKeypoints(element);
        const processed = clearHints(element);
        if (processed.type !== "HEADER" && processed.type !== "LINE") continue;

        entries.push({
          lineIndex: processed.trackingProperties.line_index,
          audioUrl,
          keypoints,
          displayElement: processed,
        });
      }
    }
    return entries;
  }, [parts]);

  const audioRef = React.useRef<HTMLAudioElement>(null);
  const lineRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

  const [mergeState, setMergeState] = React.useState<
    "idle" | "building" | "ready" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [mergedSrc, setMergedSrc] = React.useState<string | null>(null);
  const [timelineMeta, setTimelineMeta] = React.useState<TimelineMeta[]>([]);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [activeAudioRange, setActiveAudioRange] = React.useState(99999);
  const [showLargeMergeWarning, setShowLargeMergeWarning] =
    React.useState(false);

  const buildMergedAudio = React.useCallback(async () => {
    if (!timelineSegments.length) {
      setMergeState("error");
      setErrorMessage("No audio segments found.");
      return null;
    }

    setMergeState("building");
    setErrorMessage(null);

    const decodeCtx = new AudioContext({ latencyHint: "playback" });
    try {
      const decodedBuffers: AudioBuffer[] = [];
      const meta: TimelineMeta[] = [];
      let start = 0;

      for (const segment of timelineSegments) {
        const arrayBuffer = await fetchArrayBufferWithRetry(segment.audioUrl);
        const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
        decodedBuffers.push(decoded);
        meta.push({
          lineIndex: segment.lineIndex,
          start,
          duration: decoded.duration,
          keypoints: segment.keypoints,
        });
        start += decoded.duration;
      }

      const wavBlob = mergeBuffersToWav(decodedBuffers);
      const nextSrc = URL.createObjectURL(wavBlob);

      setTimelineMeta(meta);
      setMergedSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextSrc;
      });
      setDuration(start);
      setCurrentTime(0);
      setMergeState("ready");
      return nextSrc;
    } catch (error) {
      setMergeState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to build merged audio.",
      );
      return null;
    } finally {
      await decodeCtx.close();
    }
  }, [timelineSegments]);

  React.useEffect(() => {
    setMergeState("idle");
    setErrorMessage(null);
    setTimelineMeta([]);
    setDuration(0);
    setCurrentTime(0);
    setActiveAudioRange(99999);
    setShowLargeMergeWarning(
      timelineSegments.length >= LARGE_MERGE_SEGMENT_THRESHOLD,
    );
    setMergedSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [timelineSegments]);

  React.useEffect(() => {
    return () => {
      if (mergedSrc) URL.revokeObjectURL(mergedSrc);
    };
  }, [mergedSrc]);

  const ensureMergedAndPlay = React.useCallback(async () => {
    let src = mergedSrc;
    if (!src) {
      src = await buildMergedAudio();
    }
    if (!src || !audioRef.current) return;

    if (audioRef.current.src !== src) {
      audioRef.current.src = src;
      audioRef.current.load();
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      setIsPlaying(false);
    }
  }, [buildMergedAudio, mergedSrc]);

  const pause = React.useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlayPause = React.useCallback(async () => {
    if (isPlaying) {
      pause();
      return;
    }
    await ensureMergedAndPlay();
  }, [ensureMergedAndPlay, isPlaying, pause]);

  const onSeek = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(event.target.value);
      if (!Number.isFinite(next)) return;
      const clamped = Math.max(0, Math.min(next, duration));
      if (audioRef.current) {
        audioRef.current.currentTime = clamped;
      }
      setCurrentTime(clamped);
      setActiveAudioRange(99999);
    },
    [duration],
  );

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(duration);
      setActiveAudioRange(99999);
    };
    const onTimeUpdate = () => {
      const t = audio.currentTime;
      setCurrentTime(t);

      const idx = findSegmentIndexByTime(timelineMeta, t);
      const segment = idx >= 0 ? timelineMeta[idx] : undefined;
      if (!segment?.keypoints?.length) {
        setActiveAudioRange(99999);
        return;
      }

      const segmentMs = Math.max(0, (t - segment.start) * 1000);
      let nextRange = 99999;
      for (const keypoint of segment.keypoints) {
        if (segmentMs >= keypoint.audioStart) nextRange = keypoint.rangeEnd;
        else break;
      }
      setActiveAudioRange(nextRange);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [duration, timelineMeta]);

  React.useEffect(() => {
    void ensureMergedAndPlay();
  }, [ensureMergedAndPlay]);

  const activeLineIndex = React.useMemo(() => {
    const idx = findSegmentIndexByTime(timelineMeta, currentTime);
    return idx >= 0 ? timelineMeta[idx].lineIndex : undefined;
  }, [currentTime, timelineMeta]);

  React.useEffect(() => {
    if (activeLineIndex === undefined) return;
    const node = lineRefs.current[activeLineIndex];
    if (!node || typeof window === "undefined") return;

    const rect = node.getBoundingClientRect();
    const desiredTop = window.innerHeight / 3;
    const targetY = window.scrollY + rect.top - desiredTop;
    window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
  }, [activeLineIndex]);

  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;
    mediaSession.playbackState = isPlaying ? "playing" : "paused";
    if (typeof MediaMetadata !== "undefined") {
      mediaSession.metadata = new MediaMetadata({
        title: "Story Autoplay",
        artist: `Duostories ${story.learning_language ?? ""}`.trim(),
        album: "Duostories",
      });
    }

    mediaSession.setActionHandler("play", () => {
      void ensureMergedAndPlay();
    });
    mediaSession.setActionHandler("pause", () => {
      pause();
    });

    return () => {
      mediaSession.setActionHandler("play", null);
      mediaSession.setActionHandler("pause", null);
    };
  }, [ensureMergedAndPlay, isPlaying, pause, story.learning_language]);

  return (
    <div className={styles.container}>
      <StoryHeaderProgress
        course={course}
        progress={currentTime}
        length={duration || 1}
      />
      <audio ref={audioRef} className={styles.mediaOutput} playsInline />
      <div className={styles.main}>
        <div className={styles.audioWrap}>
          <button
            className={styles.playPauseButton}
            onClick={() => {
              void togglePlayPause();
            }}
            disabled={
              mergeState === "building" || timelineSegments.length === 0
            }
          >
            {mergeState === "building"
              ? "Building..."
              : isPlaying
                ? "Pause"
                : "Play"}
          </button>
          <input
            className={styles.timelineSlider}
            type="range"
            min={0}
            max={Math.max(duration, 0.01)}
            step={0.01}
            value={Math.min(currentTime, duration || 0)}
            onChange={onSeek}
            disabled={mergeState !== "ready" || duration <= 0}
          />
          <div className={styles.timelineTime}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          {showLargeMergeWarning && mergeState === "idle" && (
            <div className={styles.timelineStatus}>
              Large story: first play may take longer while audio is merged.
            </div>
          )}
          {mergeState === "error" && (
            <div className={styles.timelineError}>
              Could not build merged audio: {errorMessage}
            </div>
          )}
        </div>

        <div
          className={
            styles.story +
            " " +
            (story.learning_language_rtl ? styles.storyRtl : "")
          }
        >
          <div className={styles.spacerSmallTop} />
          <Legal />
          {parts.map((part, partIndex) => (
            <AutoPlayPart
              key={partIndex}
              part={part}
              settings={settings}
              activeLineIndex={activeLineIndex}
              lineRefs={lineRefs}
              activeAudioRange={activeAudioRange}
            />
          ))}
        </div>
        <div className={styles.spacerSmall} />
      </div>
    </div>
  );
}

interface AutoPlayPartProps {
  part: StoryElement[];
  settings: typeof autoPlaySettings & { rtl: boolean };
  activeLineIndex?: number;
  lineRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  activeAudioRange: number;
}

function AutoPlayPart({
  part,
  settings,
  activeLineIndex,
  lineRefs,
  activeAudioRange,
}: AutoPlayPartProps) {
  return (
    <div className="part">
      {part.map((element, i) => (
        <AutoPlayElement
          key={i}
          element={element}
          settings={settings}
          activeLineIndex={activeLineIndex}
          lineRefs={lineRefs}
          activeAudioRange={activeAudioRange}
        />
      ))}
    </div>
  );
}

interface AutoPlayElementProps {
  element: StoryElement;
  settings: typeof autoPlaySettings & { rtl: boolean };
  activeLineIndex?: number;
  lineRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  activeAudioRange: number;
}

function AutoPlayElement({
  element,
  settings,
  activeLineIndex,
  lineRefs,
  activeAudioRange,
}: AutoPlayElementProps) {
  const processedElement = clearHints(element);
  const lineIndex = processedElement.trackingProperties?.line_index;
  const visibleUntil = activeLineIndex ?? 0;

  if (lineIndex !== undefined && lineIndex > visibleUntil) {
    return null;
  }

  const isActive = activeLineIndex === lineIndex;
  const className = isActive
    ? `${styles.autoPlayItem} ${styles.autoPlayItemActive}`
    : styles.autoPlayItem;

  if (processedElement.type === "HEADER") {
    return (
      <div
        className={className}
        ref={(node) => {
          if (lineIndex !== undefined) lineRefs.current[lineIndex] = node;
        }}
      >
        <StoryHeader
          active={false}
          element={processedElement as StoryElementHeader}
          settings={settings}
          hideAudioButton={true}
          audioRangeOverride={isActive ? activeAudioRange : undefined}
        />
      </div>
    );
  }

  if (processedElement.type === "LINE") {
    return (
      <div
        className={className}
        ref={(node) => {
          if (lineIndex !== undefined) lineRefs.current[lineIndex] = node;
        }}
      >
        <StoryTextLine
          active={false}
          element={processedElement as StoryElementLine}
          settings={settings}
          hideAudioButton={true}
          audioRangeOverride={isActive ? activeAudioRange : undefined}
        />
      </div>
    );
  }

  return null;
}
