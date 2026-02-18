"use client";
import React from "react";
import styles from "./StoryAutoPlay.module.css";
import StoryTextLine from "../StoryTextLine";
import StoryHeader from "../StoryHeader";
import StoryHeaderProgress from "../StoryHeaderProgress";
import Legal from "../layout/legal";
import type { StoryType } from "@/components/editor/story/syntax_parser_new";
import type {
  Audio,
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";

interface StoryAutoPlayProps {
  story: StoryType & {
    learning_language_rtl?: boolean;
    learning_language?: string;
    from_language?: string;
  };
}

type AutoPlayableElement = StoryElementHeader | StoryElementLine;

const FALLBACK_SEGMENT_DURATION_SECONDS = 2.5;

// Settings that disable all interactive features
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

function GetParts(story: StoryType) {
  const parts: StoryElement[][] = [];
  let last_id = -1;
  for (const element of story.elements) {
    if (element.trackingProperties === undefined) {
      continue;
    }
    if (last_id !== element.trackingProperties.line_index) {
      parts.push([]);
      last_id = element.trackingProperties.line_index;
    }
    parts[parts.length - 1].push(element);
  }
  return parts;
}

function getElementAudioUrl(element: AutoPlayableElement): string | undefined {
  const audio = getElementAudio(element);
  if (!audio?.url) return undefined;
  if (audio.url.startsWith("blob")) return audio.url;
  return `https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/${audio.url}`;
}

function getElementAudio(element: AutoPlayableElement): Audio | undefined {
  const audio =
    element.type === "HEADER"
      ? element.learningLanguageTitleContent?.audio
      : element.line?.content?.audio;
  return audio;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function findSegmentIndexByTime(
  starts: number[],
  targetSeconds: number,
): number {
  if (!starts.length) return 0;
  let index = 0;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] <= targetSeconds) index = i;
    else break;
  }
  return index;
}

function getLanguageDisplayName(languageCode?: string): string {
  if (!languageCode) return "Unknown";
  try {
    const normalized = languageCode.replace("_", "-");
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    return displayNames.of(normalized) || languageCode;
  } catch {
    return languageCode;
  }
}

function toAbsoluteMediaUrl(src: string, origin: string): string {
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  return `${origin}/${src.replace(/^\/+/, "")}`;
}

function getArtworkMimeType(src: string): string | undefined {
  const cleanSrc = src.split("?")[0].toLowerCase();
  if (cleanSrc.endsWith(".png")) return "image/png";
  if (cleanSrc.endsWith(".jpg") || cleanSrc.endsWith(".jpeg"))
    return "image/jpeg";
  if (cleanSrc.endsWith(".webp")) return "image/webp";
  if (cleanSrc.endsWith(".svg")) return "image/svg+xml";
  return undefined;
}

function clearHints(element: StoryElement): StoryElement {
  // Deep clone and clear hints for auto_play mode
  if (element.type === "LINE") {
    return {
      ...element,
      line: {
        ...element.line,
        content: {
          ...element.line.content,
          hintMap: [],
          hints_pronunciation: [],
        },
      },
    };
  }
  if (element.type === "HEADER") {
    return {
      ...element,
      learningLanguageTitleContent: {
        ...element.learningLanguageTitleContent,
        hintMap: [],
        hints_pronunciation: [],
      },
    };
  }
  return element;
}

export default function StoryAutoPlay({ story }: StoryAutoPlayProps) {
  const parts = React.useMemo(() => GetParts(story), [story]);
  const course = `${story.learning_language}-${story.from_language}`;
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const seekTargetRef = React.useRef<null | {
    segmentIndex: number;
    offset: number;
  }>(null);
  const lineRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const autoStartAttemptedRef = React.useRef(false);

  const settings = {
    ...autoPlaySettings,
    rtl: story.learning_language_rtl ?? false,
  };

  const timelineElements = React.useMemo(() => {
    const elements: Array<{
      element: AutoPlayableElement;
      audioUrl: string;
    }> = [];
    for (const part of parts) {
      for (const entry of part) {
        const processedEntry = clearHints(entry);
        if (
          processedEntry.type !== "HEADER" &&
          processedEntry.type !== "LINE"
        ) {
          continue;
        }
        const audioUrl = getElementAudioUrl(processedEntry);
        if (audioUrl) {
          elements.push({
            element: processedEntry,
            audioUrl,
          });
        }
      }
    }
    return elements;
  }, [parts]);

  const timelineKey = React.useMemo(
    () =>
      timelineElements
        .map(
          ({ element, audioUrl }) =>
            `${element.trackingProperties.line_index}:${audioUrl}`,
        )
        .join("|"),
    [timelineElements],
  );

  const [durationsByIndex, setDurationsByIndex] = React.useState(() =>
    Array.from(
      { length: timelineElements.length },
      () => FALLBACK_SEGMENT_DURATION_SECONDS,
    ),
  );
  const [currentSegmentIndex, setCurrentSegmentIndex] = React.useState(0);
  const [globalProgressSeconds, setGlobalProgressSeconds] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [activeAudioRange, setActiveAudioRange] = React.useState(99999);
  const playCallbackRef = React.useRef<(() => Promise<void>) | null>(null);
  const pauseCallbackRef = React.useRef<(() => void) | null>(null);
  const stopCallbackRef = React.useRef<(() => void) | null>(null);
  const seekToCallbackRef = React.useRef<
    ((value: number) => Promise<void>) | null
  >(null);

  React.useEffect(() => {
    autoStartAttemptedRef.current = false;
    setDurationsByIndex(
      Array.from(
        { length: timelineElements.length },
        () => FALLBACK_SEGMENT_DURATION_SECONDS,
      ),
    );
    setCurrentSegmentIndex(0);
    setGlobalProgressSeconds(0);
    setIsPlaying(false);
    setActiveAudioRange(99999);
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.pause();
      audioElement.removeAttribute("src");
      audioElement.load();
    }
  }, [timelineKey, timelineElements.length]);

  const segmentStarts = React.useMemo(() => {
    const starts: number[] = [];
    let sum = 0;
    for (let i = 0; i < durationsByIndex.length; i++) {
      starts.push(sum);
      sum += durationsByIndex[i] ?? FALLBACK_SEGMENT_DURATION_SECONDS;
    }
    return starts;
  }, [durationsByIndex]);

  const totalDurationSeconds = React.useMemo(() => {
    if (!durationsByIndex.length) return 0;
    return durationsByIndex.reduce((sum, value) => sum + value, 0);
  }, [durationsByIndex]);

  const activeLineIndex =
    timelineElements[currentSegmentIndex]?.element.trackingProperties
      .line_index;

  React.useEffect(() => {
    if (activeLineIndex === undefined) return;
    const node = lineRefs.current[activeLineIndex];
    if (!node || typeof window === "undefined") return;
    const rect = node.getBoundingClientRect();
    const desiredTop = window.innerHeight / 3;
    const targetY = window.scrollY + rect.top - desiredTop;
    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: "smooth",
    });
  }, [activeLineIndex]);

  const syncGlobalProgressWithCurrentAudio = React.useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    const segmentStart = segmentStarts[currentSegmentIndex] ?? 0;
    const current = clamp(
      segmentStart + audioElement.currentTime,
      0,
      Math.max(totalDurationSeconds, 0),
    );
    setGlobalProgressSeconds(current);
  }, [currentSegmentIndex, segmentStarts, totalDurationSeconds]);

  const startSegmentPlayback = React.useCallback(
    async (
      segmentIndex: number,
      offsetSeconds: number,
      shouldPlay: boolean,
    ) => {
      const audioElement = audioRef.current;
      const segment = timelineElements[segmentIndex];
      if (!audioElement || !segment) return;

      const loadNewSource = audioElement.src !== segment.audioUrl;
      setCurrentSegmentIndex(segmentIndex);
      setActiveAudioRange(99999);

      if (loadNewSource) {
        seekTargetRef.current = {
          segmentIndex,
          offset: Math.max(0, offsetSeconds),
        };
        audioElement.src = segment.audioUrl;
        audioElement.load();
      } else {
        const safeOffset = clamp(
          offsetSeconds,
          0,
          Math.max((durationsByIndex[segmentIndex] ?? 0) - 0.05, 0),
        );
        audioElement.currentTime = safeOffset;
      }

      if (shouldPlay) {
        try {
          await audioElement.play();
          setIsPlaying(true);
        } catch (error) {
          setIsPlaying(false);
        }
      } else {
        audioElement.pause();
        setIsPlaying(false);
      }

      const segmentStart = segmentStarts[segmentIndex] ?? 0;
      setGlobalProgressSeconds(segmentStart + Math.max(0, offsetSeconds));
    },
    [durationsByIndex, segmentStarts, timelineElements],
  );

  const handlePlayPause = React.useCallback(async () => {
    const audioElement = audioRef.current;
    if (!audioElement || timelineElements.length === 0) return;

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
      syncGlobalProgressWithCurrentAudio();
      return;
    }

    const targetSegment = findSegmentIndexByTime(
      segmentStarts,
      globalProgressSeconds,
    );
    const offset = Math.max(
      0,
      globalProgressSeconds - (segmentStarts[targetSegment] ?? 0),
    );
    await startSegmentPlayback(targetSegment, offset, true);
  }, [
    globalProgressSeconds,
    isPlaying,
    segmentStarts,
    startSegmentPlayback,
    syncGlobalProgressWithCurrentAudio,
    timelineElements.length,
  ]);

  const playFromCurrentPosition = React.useCallback(async () => {
    if (timelineElements.length === 0) return;
    const safeTime = clamp(globalProgressSeconds, 0, totalDurationSeconds);
    const targetSegment = findSegmentIndexByTime(segmentStarts, safeTime);
    const offset = Math.max(0, safeTime - (segmentStarts[targetSegment] ?? 0));
    await startSegmentPlayback(targetSegment, offset, true);
  }, [
    globalProgressSeconds,
    segmentStarts,
    startSegmentPlayback,
    timelineElements.length,
    totalDurationSeconds,
  ]);

  React.useEffect(() => {
    if (timelineElements.length === 0) return;
    if (autoStartAttemptedRef.current) return;
    autoStartAttemptedRef.current = true;
    void startSegmentPlayback(0, 0, true);
  }, [startSegmentPlayback, timelineElements.length, timelineKey]);

  const pausePlayback = React.useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    audioElement.pause();
    setIsPlaying(false);
    syncGlobalProgressWithCurrentAudio();
  }, [syncGlobalProgressWithCurrentAudio]);

  const stopPlayback = React.useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    audioElement.pause();
    audioElement.currentTime = 0;
    setIsPlaying(false);
    setGlobalProgressSeconds(0);
    setCurrentSegmentIndex(0);
    setActiveAudioRange(99999);
  }, []);

  const handleSeek = React.useCallback(
    async (nextGlobalSeconds: number) => {
      if (timelineElements.length === 0) return;
      const safeTime = clamp(nextGlobalSeconds, 0, totalDurationSeconds);
      const segmentIndex = findSegmentIndexByTime(segmentStarts, safeTime);
      const segmentStart = segmentStarts[segmentIndex] ?? 0;
      const offset = Math.max(0, safeTime - segmentStart);
      await startSegmentPlayback(segmentIndex, offset, isPlaying);
      setGlobalProgressSeconds(safeTime);
    },
    [
      isPlaying,
      segmentStarts,
      startSegmentPlayback,
      timelineElements.length,
      totalDurationSeconds,
    ],
  );

  const onSeekInput = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value);
      if (!Number.isFinite(nextValue)) return;
      await handleSeek(nextValue);
    },
    [handleSeek],
  );

  React.useEffect(() => {
    playCallbackRef.current = playFromCurrentPosition;
    pauseCallbackRef.current = pausePlayback;
    stopCallbackRef.current = stopPlayback;
    seekToCallbackRef.current = handleSeek;
  }, [handleSeek, pausePlayback, playFromCurrentPosition, stopPlayback]);

  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    const mediaSession = navigator.mediaSession;
    mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;
    const headerElement = timelineElements.find(
      (item) => item.element.type === "HEADER",
    )?.element;
    const origin = window.location.origin;
    const languageName = getLanguageDisplayName(story.learning_language);
    const mediaTitle =
      headerElement && headerElement.type === "HEADER"
        ? headerElement.title || headerElement.learningLanguageTitleContent.text
        : "Story Autoplay";
    const artworkSources: Array<{
      src: string;
      sizes?: string;
      type?: string;
    }> = [];
    if (headerElement && headerElement.type === "HEADER") {
      artworkSources.push({
        src: toAbsoluteMediaUrl(headerElement.illustrationUrl, origin),
        // Story artwork can be non-square; do not claim fixed square dimensions.
        sizes: "any",
        type: getArtworkMimeType(headerElement.illustrationUrl),
      });
    }
    artworkSources.push(
      {
        src: `${origin}/icon512.png`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${origin}/icon192.png`,
        sizes: "192x192",
        type: "image/png",
      },
    );

    const seenSources = new Set<string>();
    const artwork = artworkSources
      .filter((entry) => {
        if (seenSources.has(entry.src)) return false;
        seenSources.add(entry.src);
        return true;
      })
      .map((entry) => ({
        src: entry.src,
        sizes: entry.sizes,
        type: entry.type ?? getArtworkMimeType(entry.src),
      }));

    if (typeof MediaMetadata !== "undefined") {
      mediaSession.metadata = new MediaMetadata({
        title: mediaTitle,
        artist: `${languageName} - Duostories`,
        album: "Duostories",
        artwork,
      });
    }

    mediaSession.setActionHandler("play", () => {
      void playCallbackRef.current?.();
    });
    mediaSession.setActionHandler("pause", () => {
      pauseCallbackRef.current?.();
    });
    mediaSession.setActionHandler("stop", () => {
      stopCallbackRef.current?.();
    });
    mediaSession.setActionHandler("seekto", (details) => {
      if (typeof details.seekTime !== "number") return;
      void seekToCallbackRef.current?.(details.seekTime);
    });
    mediaSession.setActionHandler("seekbackward", (details) => {
      const step = details.seekOffset ?? 10;
      void seekToCallbackRef.current?.(
        Math.max(0, globalProgressSeconds - step),
      );
    });
    mediaSession.setActionHandler("seekforward", (details) => {
      const step = details.seekOffset ?? 10;
      void seekToCallbackRef.current?.(
        Math.min(totalDurationSeconds, globalProgressSeconds + step),
      );
    });
    mediaSession.setActionHandler("previoustrack", () => {
      void seekToCallbackRef.current?.(Math.max(0, globalProgressSeconds - 10));
    });
    mediaSession.setActionHandler("nexttrack", () => {
      void seekToCallbackRef.current?.(
        Math.min(totalDurationSeconds, globalProgressSeconds + 10),
      );
    });

    return () => {
      mediaSession.setActionHandler("play", null);
      mediaSession.setActionHandler("pause", null);
      mediaSession.setActionHandler("stop", null);
      mediaSession.setActionHandler("seekto", null);
      mediaSession.setActionHandler("seekbackward", null);
      mediaSession.setActionHandler("seekforward", null);
      mediaSession.setActionHandler("previoustrack", null);
      mediaSession.setActionHandler("nexttrack", null);
    };
  }, [
    globalProgressSeconds,
    story.from_language,
    story.learning_language,
    timelineElements,
    totalDurationSeconds,
  ]);

  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    const mediaSession = navigator.mediaSession;
    if (typeof mediaSession.setPositionState !== "function") return;
    try {
      mediaSession.setPositionState({
        duration: Math.max(totalDurationSeconds, 0.1),
        playbackRate: 1,
        position: clamp(
          globalProgressSeconds,
          0,
          Math.max(totalDurationSeconds, 0),
        ),
      });
    } catch (error) {
      // Some browsers throw when duration is unknown or zero.
    }
  }, [globalProgressSeconds, totalDurationSeconds]);

  const onAudioLoadedMetadata = React.useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !Number.isFinite(audioElement.duration)) return;
    setDurationsByIndex((prev) => {
      const next = [...prev];
      next[currentSegmentIndex] = Math.max(audioElement.duration, 0.1);
      return next;
    });

    const target = seekTargetRef.current;
    if (!target || target.segmentIndex !== currentSegmentIndex) return;

    const safeOffset = clamp(
      target.offset,
      0,
      Math.max(audioElement.duration - 0.05, 0),
    );
    audioElement.currentTime = safeOffset;
    seekTargetRef.current = null;
  }, [currentSegmentIndex]);

  const onAudioTimeUpdate = React.useCallback(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const activeSegment = timelineElements[currentSegmentIndex];
      const keypoints = activeSegment
        ? getElementAudio(activeSegment.element)?.keypoints
        : undefined;
      if (keypoints?.length) {
        const currentMs = audioElement.currentTime * 1000;
        let nextRange = 99999;
        for (const keypoint of keypoints) {
          if (currentMs >= keypoint.audioStart) {
            nextRange = keypoint.rangeEnd;
          } else {
            break;
          }
        }
        setActiveAudioRange(nextRange);
      } else {
        setActiveAudioRange(99999);
      }
    }
    syncGlobalProgressWithCurrentAudio();
  }, [
    currentSegmentIndex,
    syncGlobalProgressWithCurrentAudio,
    timelineElements,
  ]);

  const onAudioEnded = React.useCallback(async () => {
    const nextSegment = currentSegmentIndex + 1;
    if (nextSegment >= timelineElements.length) {
      setIsPlaying(false);
      setGlobalProgressSeconds(totalDurationSeconds);
      return;
    }
    await startSegmentPlayback(nextSegment, 0, true);
  }, [
    currentSegmentIndex,
    startSegmentPlayback,
    timelineElements.length,
    totalDurationSeconds,
  ]);

  return (
    <div className={styles.container}>
      <StoryHeaderProgress
        course={course}
        progress={Math.min(currentSegmentIndex + 1, timelineElements.length)}
        length={Math.max(timelineElements.length, 1)}
      />
      <audio
        ref={audioRef}
        onLoadedMetadata={onAudioLoadedMetadata}
        onTimeUpdate={onAudioTimeUpdate}
        onEnded={onAudioEnded}
        preload="metadata"
      />
      <div className={styles.timelineControls}>
        <button
          className={styles.playPauseButton}
          onClick={handlePlayPause}
          disabled={timelineElements.length === 0}
          aria-label={
            isPlaying ? "Pause story playback" : "Play story playback"
          }
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <span className={styles.pauseIcon} aria-hidden="true">
              <span className={styles.pauseIconBar} />
              <span className={styles.pauseIconBar} />
            </span>
          ) : (
            <span className={styles.playIcon} aria-hidden="true" />
          )}
        </button>
        <input
          className={styles.timelineSlider}
          type="range"
          min={0}
          max={Math.max(totalDurationSeconds, 0)}
          step={0.01}
          value={clamp(
            globalProgressSeconds,
            0,
            Math.max(totalDurationSeconds, 0),
          )}
          onChange={onSeekInput}
          disabled={timelineElements.length === 0}
          aria-label="Story playback timeline"
        />
        <div className={styles.timelineTime}>
          {Math.floor(globalProgressSeconds)}s /{" "}
          {Math.floor(totalDurationSeconds)}s
        </div>
      </div>
      <div className={styles.main}>
        <div
          className={
            styles.story +
            " " +
            (story.learning_language_rtl ? styles.story_rtl : "")
          }
        >
          <div className={styles.spacer_small_top} />
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
        <div className={styles.spacer_small} />
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
  // Clear hints for auto_play mode
  const processedElement = clearHints(element);
  const lineIndex = processedElement.trackingProperties?.line_index;
  const isActive = activeLineIndex === lineIndex;
  const itemClassName = isActive
    ? `${styles.autoPlayItem} ${styles.autoPlayItemActive}`
    : styles.autoPlayItem;

  if (processedElement.type === "HEADER") {
    return (
      <div
        className={itemClassName}
        ref={(node) => {
          if (lineIndex !== undefined) lineRefs.current[lineIndex] = node;
        }}
      >
        <StoryHeader
          active={false}
          element={processedElement as StoryElementHeader}
          settings={settings}
          audioRangeOverride={isActive ? activeAudioRange : undefined}
          hideAudioButton={true}
        />
      </div>
    );
  }

  if (processedElement.type === "LINE") {
    return (
      <div
        className={itemClassName}
        ref={(node) => {
          if (lineIndex !== undefined) lineRefs.current[lineIndex] = node;
        }}
      >
        <StoryTextLine
          active={false}
          element={processedElement as StoryElementLine}
          settings={settings}
          audioRangeOverride={isActive ? activeAudioRange : undefined}
          hideAudioButton={true}
        />
      </div>
    );
  }

  // Skip questions and other interactive elements in auto_play mode
  return null;
}
