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

function findSegmentIndexByTime(starts: number[], targetSeconds: number): number {
  if (!starts.length) return 0;
  let index = 0;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] <= targetSeconds) index = i;
    else break;
  }
  return index;
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
  const seekTargetRef = React.useRef<null | { segmentIndex: number; offset: number }>(null);
  const lineRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

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
        if (processedEntry.type !== "HEADER" && processedEntry.type !== "LINE") {
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

  React.useEffect(() => {
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
    timelineElements[currentSegmentIndex]?.element.trackingProperties.line_index;

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
    async (segmentIndex: number, offsetSeconds: number, shouldPlay: boolean) => {
      const audioElement = audioRef.current;
      const segment = timelineElements[segmentIndex];
      if (!audioElement || !segment) return;

      const loadNewSource = audioElement.src !== segment.audioUrl;
      setCurrentSegmentIndex(segmentIndex);
      setActiveAudioRange(99999);

      if (loadNewSource) {
        seekTargetRef.current = { segmentIndex, offset: Math.max(0, offsetSeconds) };
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

    const targetSegment = findSegmentIndexByTime(segmentStarts, globalProgressSeconds);
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
  }, [currentSegmentIndex, syncGlobalProgressWithCurrentAudio, timelineElements]);

  const onAudioEnded = React.useCallback(async () => {
    const nextSegment = currentSegmentIndex + 1;
    if (nextSegment >= timelineElements.length) {
      setIsPlaying(false);
      setGlobalProgressSeconds(totalDurationSeconds);
      return;
    }
    await startSegmentPlayback(nextSegment, 0, true);
  }, [currentSegmentIndex, startSegmentPlayback, timelineElements.length, totalDurationSeconds]);

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
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          className={styles.timelineSlider}
          type="range"
          min={0}
          max={Math.max(totalDurationSeconds, 0)}
          step={0.01}
          value={clamp(globalProgressSeconds, 0, Math.max(totalDurationSeconds, 0))}
          onChange={onSeekInput}
          disabled={timelineElements.length === 0}
          aria-label="Story playback timeline"
        />
        <div className={styles.timelineTime}>
          {Math.floor(globalProgressSeconds)}s / {Math.floor(totalDurationSeconds)}s
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
