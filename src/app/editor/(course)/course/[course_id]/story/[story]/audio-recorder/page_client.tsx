"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleStop,
  Mic,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useWavesurfer } from "@wavesurfer/react";
import { api } from "@convex/_generated/api";
import type {
  DetailedCourseProps,
  StoryListDataProps,
} from "@/app/editor/(course)/types";
import type {
  Avatar,
  StoryEditorPageData,
} from "@/app/editor/story/[story]/types";
import { Breadcrumbs } from "@/app/editor/_components/breadcrumbs";
import {
  EditorHeaderActions,
  EditorHeaderBreadcrumbs,
} from "@/app/editor/_components/header_context";
import { processStoryFile } from "@/components/editor/story/syntax_parser_new";
import type {
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import Button from "@/components/Button";
import { isTypingTarget } from "@/lib/is-typing-target";
import { cn } from "@/lib/utils";

type LanguageData = {
  short: string;
  rtl: boolean;
  tts_replace: string | null;
};

type RecordingLine = {
  id: string;
  order: number;
  lineIndex: number;
  speaker: string;
  text: string;
  type: "HEADER" | "LINE";
};

type RecordingDraft = {
  blob: Blob;
  url: string;
  durationMs: number;
  recordedAt: number;
  analysis?: RecordingAnalysis;
};

type TimeRange = {
  start: number;
  end: number;
};

type RecordingAnalysis = {
  duration: number;
  trimRanges: TimeRange[];
  skipRanges: TimeRange[];
};

const ALL_SPEAKERS = "All";
const NARRATOR = "Narrator";
const SILENCE_WINDOW_SECONDS = 0.02;
const DETECTION_START_BUFFER_SECONDS = 0.04;
const DETECTION_END_BUFFER_SECONDS = 0.04;
const MAX_INTERNAL_SILENCE_SECONDS = 0.3;

export default function AudioRecorderPageClient({
  storyId,
  courseId,
}: {
  storyId: number;
  courseId: string;
}) {
  const router = useRouter();
  const [selectedSpeaker, setSelectedSpeaker] = React.useState(ALL_SPEAKERS);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [recordingLineId, setRecordingLineId] = React.useState<string | null>(
    null,
  );
  const [recordings, setRecordings] = React.useState<
    Record<string, RecordingDraft>
  >({});
  const [recorderError, setRecorderError] = React.useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordingStartedAtRef = React.useRef(0);
  const [liveStream, setLiveStream] = React.useState<MediaStream | null>(null);
  const recordingsRef = React.useRef<Record<string, RecordingDraft>>({});

  const data = useQuery(api.editorRead.getEditorStoryPageData, {
    storyId,
  }) as StoryEditorPageData | null | undefined;
  const effectiveCourseId =
    data?.story_data.short && data.story_data.short !== courseId
      ? data.story_data.short
      : courseId;
  const course = useQuery(
    api.editorRead.getEditorCourseByIdentifier,
    effectiveCourseId ? { identifier: effectiveCourseId } : "skip",
  ) as DetailedCourseProps | null | undefined;
  const stories = useQuery(
    api.editorRead.getEditorStoriesByCourseLegacyId,
    effectiveCourseId ? { identifier: effectiveCourseId } : "skip",
  ) as StoryListDataProps[] | undefined;
  const avatarRows = useQuery(
    api.editorRead.getEditorAvatarNamesByLanguageLegacyId,
    data ? { languageLegacyId: data.story_data.learning_language } : "skip",
  ) as Avatar[] | undefined;
  const learningLanguage = useQuery(
    api.editorRead.getEditorLanguageByLegacyId,
    data ? { legacyLanguageId: data.story_data.learning_language } : "skip",
  ) as LanguageData | null | undefined;
  const fromLanguage = useQuery(
    api.editorRead.getEditorLanguageByLegacyId,
    data ? { legacyLanguageId: data.story_data.from_language } : "skip",
  ) as LanguageData | null | undefined;

  const coursePathId = course?.short ?? effectiveCourseId;
  const storyIndex =
    stories?.findIndex((story) => story.id === data?.story_data.id) ?? -1;
  const previousStory = storyIndex > 0 ? stories?.[storyIndex - 1] : null;
  const nextStory =
    storyIndex >= 0 && stories && storyIndex < stories.length - 1
      ? stories[storyIndex + 1]
      : null;

  const lines = React.useMemo(() => {
    if (!data || !avatarRows || !learningLanguage || !fromLanguage) return [];

    const avatarNames: Record<number, Avatar> = {};
    for (const avatar of avatarRows) {
      avatarNames[avatar.avatar_id] = avatar;
    }

    const [parsedStory] = processStoryFile(
      data.story_data.text,
      data.story_data.id,
      avatarNames,
      {
        learning_language: learningLanguage.short,
        from_language: fromLanguage.short,
      },
      learningLanguage.tts_replace ?? "",
    );

    return getRecordingLines(parsedStory.elements);
  }, [avatarRows, data, fromLanguage, learningLanguage]);

  const speakers = React.useMemo(() => {
    const names = new Set<string>();
    for (const line of lines) names.add(line.speaker);
    return [ALL_SPEAKERS, ...Array.from(names).sort(sortSpeakers)];
  }, [lines]);

  const visibleLines = React.useMemo(() => {
    if (selectedSpeaker === ALL_SPEAKERS) return lines;
    return lines.filter((line) => line.speaker === selectedSpeaker);
  }, [lines, selectedSpeaker]);

  const currentLine = visibleLines[currentIndex];
  const completedVisibleCount = visibleLines.filter(
    (line) => recordings[line.id],
  ).length;

  React.useEffect(() => {
    setCurrentIndex((index) =>
      visibleLines.length === 0 ? 0 : Math.min(index, visibleLines.length - 1),
    );
  }, [visibleLines.length]);

  React.useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);

  React.useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream
        .getTracks()
        .forEach((track) => track.stop());
      for (const recording of Object.values(recordingsRef.current)) {
        URL.revokeObjectURL(recording.url);
      }
    };
  }, []);

  const goToLine = React.useCallback(
    (direction: -1 | 1) => {
      setCurrentIndex((index) => {
        if (visibleLines.length === 0) return 0;
        return Math.min(
          Math.max(index + direction, 0),
          visibleLines.length - 1,
        );
      });
    },
    [visibleLines.length],
  );

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToLine(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToLine(1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToLine]);

  const startRecording = React.useCallback(async () => {
    if (!currentLine || recordingLineId) return;
    setRecorderError(null);

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecorderError("This browser does not support in-page recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recordingStartedAtRef.current = performance.now();
      mediaRecorderRef.current = recorder;
      setLiveStream(stream);

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      });
      recorder.addEventListener("stop", () => {
        stream.getTracks().forEach((track) => track.stop());
        setLiveStream(null);
        const blob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });
        const durationMs = performance.now() - recordingStartedAtRef.current;
        setRecordings((current) => {
          const previous = current[currentLine.id];
          if (previous) URL.revokeObjectURL(previous.url);
          return {
            ...current,
            [currentLine.id]: {
              blob,
              url: URL.createObjectURL(blob),
              durationMs,
              recordedAt: Date.now(),
            },
          };
        });
        analyzeRecordingBlob(blob)
          .then((analysis) => {
            setRecordings((current) => {
              const recording = current[currentLine.id];
              if (!recording || recording.blob !== blob) return current;
              return {
                ...current,
                [currentLine.id]: {
                  ...recording,
                  analysis,
                },
              };
            });
          })
          .catch(() => {
            setRecordings((current) => {
              const recording = current[currentLine.id];
              if (!recording || recording.blob !== blob) return current;
              return {
                ...current,
                [currentLine.id]: {
                  ...recording,
                  analysis: {
                    duration: durationMs / 1000,
                    trimRanges: [],
                    skipRanges: [],
                  },
                },
              };
            });
          });
        setRecordingLineId(null);
        mediaRecorderRef.current = null;
      });

      setRecordingLineId(currentLine.id);
      recorder.start();
    } catch (error) {
      setLiveStream(null);
      setRecorderError(
        error instanceof Error
          ? error.message
          : "Microphone permission was not granted.",
      );
    }
  }, [currentLine, recordingLineId]);

  const stopRecording = React.useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetCurrentRecording = React.useCallback(() => {
    if (!currentLine) return;
    setRecordings((current) => {
      const existing = current[currentLine.id];
      if (existing) URL.revokeObjectURL(existing.url);
      const next = { ...current };
      delete next[currentLine.id];
      return next;
    });
  }, [currentLine]);

  const activeRecording = currentLine ? recordings[currentLine.id] : undefined;
  const isRecordingCurrent = currentLine?.id === recordingLineId;
  const loading = data === undefined || course === undefined;
  const readyForLines = data && avatarRows && learningLanguage && fromLanguage;

  return (
    <>
      {course && data ? (
        <EditorHeaderBreadcrumbs>
          <Breadcrumbs
            path={[
              { type: "Editor", href: `/editor` },
              { type: "sep", href: "#" },
              {
                type: "course",
                lang1: {
                  languageId: course.learningLanguageId,
                  name: course.learning_language_name,
                },
                lang2: {
                  languageId: course.fromLanguageId,
                  name: course.from_language_name,
                },
                href: coursePathId
                  ? `/editor/course/${coursePathId}`
                  : undefined,
              },
              { type: "sep", href: "#" },
              {
                type: "story",
                href: coursePathId
                  ? `/editor/course/${coursePathId}/story/${storyId}`
                  : undefined,
                data: data.story_data,
              },
              { type: "sep", href: "#" },
              { type: "Audio recorder" },
            ]}
          />
        </EditorHeaderBreadcrumbs>
      ) : null}
      <EditorHeaderActions>
        <div className="flex items-center">
          <StoryNavButton
            href={
              previousStory && coursePathId
                ? `/editor/course/${coursePathId}/story/${previousStory.id}/audio-recorder`
                : undefined
            }
            label="Previous"
            title={previousStory?.name}
            compactIconDirection="left"
          />
          <StoryNavButton
            href={
              nextStory && coursePathId
                ? `/editor/course/${coursePathId}/story/${nextStory.id}/audio-recorder`
                : undefined
            }
            label="Next"
            title={nextStory?.name}
            compactIconDirection="right"
          />
        </div>
      </EditorHeaderActions>
      <main className="min-h-0 flex-1 overflow-auto bg-[var(--body-background)]">
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <section className="flex flex-col gap-4 border-b border-[var(--overview-hr)] pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-color-dim)]">
                Audio recorder
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[var(--text-color)]">
                {data?.story_data.name ?? "Loading story..."}
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-md border border-[var(--overview-hr)] bg-[var(--body-background-faint)] p-2 text-center">
              <Stat label="Lines" value={visibleLines.length} />
              <Stat label="Done" value={completedVisibleCount} />
              <Stat
                label="Current"
                value={
                  visibleLines.length > 0
                    ? `${currentIndex + 1}/${visibleLines.length}`
                    : "0/0"
                }
              />
            </div>
          </section>

          <section className="flex flex-wrap gap-2" aria-label="Speaker filter">
            {speakers.map((speaker) => (
              <button
                key={speaker}
                type="button"
                className={cn(
                  "h-9 rounded-md border px-3 text-sm font-semibold transition-colors",
                  selectedSpeaker === speaker
                    ? "border-[#0f5f83] bg-[#1cb0f6] text-white"
                    : "border-[var(--overview-hr)] bg-[var(--body-background-faint)] text-[var(--text-color)] hover:border-[var(--link-blue)]",
                )}
                onClick={() => {
                  setSelectedSpeaker(speaker);
                  setCurrentIndex(0);
                }}
              >
                {speaker}
              </button>
            ))}
          </section>

          <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-h-[420px] flex-col justify-between rounded-md border border-[var(--overview-hr)] bg-[var(--body-background-faint)] p-4 shadow-sm sm:p-6">
              {loading || !readyForLines ? (
                <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-color-dim)]">
                  Loading recording lines...
                </div>
              ) : currentLine ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[var(--editor-ssml)] px-2 py-1 text-xs font-bold uppercase text-[var(--text-color)]">
                          {currentLine.speaker}
                        </span>
                        <span className="text-sm text-[var(--text-color-dim)]">
                          Line {currentLine.lineIndex || currentLine.order}
                        </span>
                      </div>
                      <p className="mt-8 max-w-3xl text-3xl font-bold leading-tight text-[var(--text-color)] sm:text-4xl">
                        {currentLine.text}
                      </p>
                    </div>
                    {activeRecording ? (
                      <span className="shrink-0 rounded-md border border-[#58a700] bg-[#ddf4cc] px-2 py-1 text-xs font-bold uppercase text-[#3c7800]">
                        Recorded
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-8 flex flex-col gap-4">
                    {recorderError ? (
                      <div className="rounded-md border border-[#ea8b8b] bg-[#fff0f0] px-3 py-2 text-sm font-medium text-[#9b1c1c]">
                        {recorderError}
                      </div>
                    ) : null}
                    {isRecordingCurrent && liveStream ? (
                      <LiveRecordingWaveform stream={liveStream} />
                    ) : activeRecording ? (
                      <RecordingWaveform
                        key={activeRecording.url}
                        url={activeRecording.url}
                        durationMs={activeRecording.durationMs}
                        analysis={activeRecording.analysis}
                      />
                    ) : (
                      <div className="h-12 rounded-md border border-dashed border-[var(--overview-hr)] px-3 py-3 text-sm text-[var(--text-color-dim)]">
                        No take recorded for this line.
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {isRecordingCurrent ? (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={stopRecording}
                          >
                            <span className="inline-flex items-center gap-2">
                              <CircleStop size={18} aria-hidden="true" />
                              Stop
                            </span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            primary
                            onClick={startRecording}
                          >
                            <span className="inline-flex items-center gap-2">
                              <Mic size={18} aria-hidden="true" />
                              {activeRecording ? "Record again" : "Record"}
                            </span>
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={resetCurrentRecording}
                          disabled={!activeRecording || isRecordingCurrent}
                        >
                          <span className="inline-flex items-center gap-2">
                            <RotateCcw size={17} aria-hidden="true" />
                            Clear
                          </span>
                        </Button>
                      </div>
                      {activeRecording ? (
                        <span className="text-sm text-[var(--text-color-dim)]">
                          {formatDuration(activeRecording.durationMs)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-color-dim)]">
                  No lines match this speaker.
                </div>
              )}
            </div>

            <aside className="min-h-0 rounded-md border border-[var(--overview-hr)] bg-[var(--body-background-faint)] p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase text-[var(--text-color-dim)]">
                  Takes
                </h2>
                <span className="text-xs text-[var(--text-color-dim)]">
                  Arrow keys navigate
                </span>
              </div>
              <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                {visibleLines.map((line, index) => (
                  <button
                    key={line.id}
                    type="button"
                    className={cn(
                      "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border p-2 text-left transition-colors",
                      index === currentIndex
                        ? "border-[#1cb0f6] bg-[color:color-mix(in_srgb,#1cb0f6_12%,var(--body-background))]"
                        : "border-[var(--overview-hr)] bg-[var(--body-background)] hover:border-[var(--link-blue)]",
                    )}
                    onClick={() => setCurrentIndex(index)}
                  >
                    <span className="text-xs font-bold text-[var(--text-color-dim)]">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm font-semibold text-[var(--text-color)]">
                      {line.text}
                    </span>
                    {recordings[line.id] ? (
                      <Play
                        size={15}
                        className="text-[#58a700]"
                        aria-label="Recorded"
                      />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-[var(--overview-hr)]" />
                    )}
                  </button>
                ))}
              </div>
            </aside>
          </section>

          <nav className="flex items-center justify-between gap-3 border-t border-[var(--overview-hr)] pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => goToLine(-1)}
              disabled={currentIndex === 0 || visibleLines.length === 0}
            >
              <span className="inline-flex items-center gap-2">
                <ChevronLeft size={18} aria-hidden="true" />
                Previous
              </span>
            </Button>
            <button
              type="button"
              className="text-sm font-semibold text-[var(--text-color-dim)] transition-colors hover:text-[var(--text-color)]"
              onClick={() =>
                router.push(
                  `/editor/course/${coursePathId ?? courseId}/story/${storyId}`,
                )
              }
            >
              Return to story
            </button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => goToLine(1)}
              disabled={
                visibleLines.length === 0 ||
                currentIndex >= visibleLines.length - 1
              }
            >
              <span className="inline-flex items-center gap-2">
                Next
                <ChevronRight size={18} aria-hidden="true" />
              </span>
            </Button>
          </nav>
        </div>
      </main>
    </>
  );
}

function RecordingWaveform({
  url,
  durationMs,
  analysis,
}: {
  url: string;
  durationMs: number;
  analysis?: RecordingAnalysis;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const seekingPastRemovedRangeRef = React.useRef(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);
  const cleanedRanges = React.useMemo(
    () =>
      normalizeRanges([
        ...(analysis?.trimRanges ?? []),
        ...(analysis?.skipRanges ?? []),
      ]),
    [analysis],
  );
  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    height: 72,
    waveColor: "#1cb0f6",
    progressColor: "rgba(88, 167, 0, 0.82)",
    cursorColor: "#0f5f83",
    normalize: true,
    barWidth: 3,
    barGap: 2,
    barRadius: 16,
    url,
  });

  const seekPastRemovedRanges = React.useCallback(() => {
    if (!wavesurfer || cleanedRanges.length === 0) return;
    if (seekingPastRemovedRangeRef.current) return;

    const currentTime = wavesurfer.getCurrentTime();
    const removedRange = cleanedRanges.find(
      (range) => currentTime >= range.start && currentTime < range.end,
    );
    if (!removedRange) return;

    if (removedRange.end >= wavesurfer.getDuration() - 0.01) {
      wavesurfer.pause();
      const replayStart = Math.min(
        Math.max(0, (cleanedRanges[0]?.end ?? 0) + 0.01),
        wavesurfer.getDuration(),
      );
      seekingPastRemovedRangeRef.current = true;
      wavesurfer.setTime(replayStart);
      window.setTimeout(() => {
        seekingPastRemovedRangeRef.current = false;
      }, 0);
      return;
    }

    seekingPastRemovedRangeRef.current = true;
    wavesurfer.setTime(
      Math.min(removedRange.end + 0.01, wavesurfer.getDuration()),
    );
    window.setTimeout(() => {
      seekingPastRemovedRangeRef.current = false;
    }, 0);
  }, [cleanedRanges, wavesurfer]);

  React.useEffect(() => {
    if (!wavesurfer) return;

    const handleReady = () => {
      setIsReady(true);
      seekPastRemovedRanges();
    };
    const handlePlay = () => {
      setIsPlaying(true);
      seekPastRemovedRanges();
    };
    const handlePause = () => setIsPlaying(false);
    const handleFinish = () => setIsPlaying(false);

    wavesurfer.on("ready", handleReady);
    wavesurfer.on("play", handlePlay);
    wavesurfer.on("timeupdate", seekPastRemovedRanges);
    wavesurfer.on("pause", handlePause);
    wavesurfer.on("finish", handleFinish);

    return () => {
      wavesurfer.un("ready", handleReady);
      wavesurfer.un("play", handlePlay);
      wavesurfer.un("timeupdate", seekPastRemovedRanges);
      wavesurfer.un("pause", handlePause);
      wavesurfer.un("finish", handleFinish);
    };
  }, [seekPastRemovedRanges, wavesurfer]);

  const togglePlayback = React.useCallback(() => {
    wavesurfer?.playPause();
  }, [wavesurfer]);

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-[var(--overview-hr)] bg-[var(--body-background)] p-3">
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0f5f83] bg-[#1cb0f6] text-white transition-colors hover:bg-[#1598d7] disabled:cursor-default disabled:opacity-60"
        onClick={togglePlayback}
        disabled={!isReady}
        aria-label={isPlaying ? "Pause recording" : "Play recording"}
      >
        {isPlaying ? (
          <Pause size={18} aria-hidden="true" />
        ) : (
          <Play size={18} aria-hidden="true" />
        )}
      </button>
      <div className="min-w-0">
        <div className="relative min-h-[72px] min-w-0 overflow-hidden rounded-md bg-[color:color-mix(in_srgb,var(--body-background-faint)_72%,transparent)]">
          <div ref={containerRef} className="min-h-[72px]" />
          {analysis ? (
            <WaveformMarkupOverlay
              duration={analysis.duration}
              trimRanges={analysis.trimRanges}
              skipRanges={analysis.skipRanges}
            />
          ) : null}
        </div>
        <RecordingAnalysisSummary analysis={analysis} />
      </div>
      <span className="w-12 text-right text-sm font-semibold text-[var(--text-color-dim)]">
        {formatDuration(durationMs)}
      </span>
    </div>
  );
}

function WaveformMarkupOverlay({
  duration,
  trimRanges,
  skipRanges,
}: {
  duration: number;
  trimRanges: TimeRange[];
  skipRanges: TimeRange[];
}) {
  if (duration <= 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      {trimRanges.map((range) => (
        <WaveformRange
          key={`trim-${range.start}-${range.end}`}
          duration={duration}
          range={range}
          className="bg-[#ff4b4b]/25"
        />
      ))}
      {skipRanges.map((range) => (
        <WaveformRange
          key={`skip-${range.start}-${range.end}`}
          duration={duration}
          range={range}
          className="bg-[#ffc800]/35"
        />
      ))}
    </div>
  );
}

function WaveformRange({
  duration,
  range,
  className,
}: {
  duration: number;
  range: TimeRange;
  className: string;
}) {
  const left = `${clamp((range.start / duration) * 100, 0, 100)}%`;
  const width = `${clamp(((range.end - range.start) / duration) * 100, 0, 100)}%`;

  return (
    <span
      className={cn(
        "absolute top-0 h-full border-x border-black/10",
        className,
      )}
      style={{ left, width }}
    />
  );
}

function RecordingAnalysisSummary({
  analysis,
}: {
  analysis?: RecordingAnalysis;
}) {
  if (!analysis) {
    return (
      <div className="mt-2 text-xs font-medium text-[var(--text-color-dim)]">
        Detecting silence...
      </div>
    );
  }

  const trimmedSeconds = sumRangeDuration(analysis.trimRanges);
  const skippedSeconds = sumRangeDuration(analysis.skipRanges);
  if (trimmedSeconds <= 0.001 && skippedSeconds <= 0.001) {
    return (
      <div className="mt-2 text-xs font-medium text-[var(--text-color-dim)]">
        No silence cleanup suggested.
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-[var(--text-color-dim)]">
      {trimmedSeconds > 0.001 ? (
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#ff4b4b]/60" />
          trims {formatDuration(trimmedSeconds * 1000)}
        </span>
      ) : null}
      {skippedSeconds > 0.001 ? (
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#ffc800]/80" />
          skips {formatDuration(skippedSeconds * 1000)} long pauses
        </span>
      ) : null}
    </div>
  );
}

function LiveRecordingWaveform({ stream }: { stream: MediaStream }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    analyser.fftSize = 1024;
    const data = new Uint8Array(analyser.fftSize);
    const samples: number[] = [];
    let animationFrame = 0;
    let lastSampleAt = 0;

    source.connect(analyser);

    function draw(timestamp: number) {
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;

      const renderedWidth = Math.floor(canvas.clientWidth);
      const renderedHeight = Math.floor(canvas.clientHeight);
      if (
        renderedWidth > 0 &&
        renderedHeight > 0 &&
        (canvas.width !== renderedWidth || canvas.height !== renderedHeight)
      ) {
        canvas.width = renderedWidth;
        canvas.height = renderedHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = 4;
      const barGap = 3;
      const step = barWidth + barGap;
      const maxBars = Math.floor(width / step);

      if (timestamp - lastSampleAt > 50) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const value of data) {
          const centered = (value - 128) / 128;
          sum += centered * centered;
        }
        const rms = Math.sqrt(sum / data.length);
        samples.push(Math.min(1, rms * 5.5));
        if (samples.length > maxBars) samples.shift();
        lastSampleAt = timestamp;
      }

      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(28, 176, 246, 0.08)";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#1cb0f6";

      const startX = Math.max(0, width - samples.length * step);
      for (let index = 0; index < samples.length; index += 1) {
        const amplitude = Math.max(0.08, samples[index]);
        const barHeight = amplitude * (height - 16);
        const x = startX + index * step;
        const y = (height - barHeight) / 2;
        drawRoundedBar(context, x, y, barWidth, barHeight, 3);
      }

      animationFrame = requestAnimationFrame(draw);
    }

    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      source.disconnect();
      analyser.disconnect();
      void audioContext.close();
    };
  }, [stream]);

  return (
    <div className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-md border border-[#1cb0f6] bg-[var(--body-background)] p-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#9b1c1c] bg-[#f7a3a3] text-[#9b1c1c]">
        <Mic size={18} aria-hidden="true" />
      </span>
      <canvas
        ref={canvasRef}
        width={900}
        height={72}
        className="h-[72px] w-full min-w-0 max-w-full rounded-md bg-[color:color-mix(in_srgb,var(--body-background-faint)_72%,transparent)]"
        aria-label="Live recording waveform"
      />
    </div>
  );
}

function drawRoundedBar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height,
  );
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.fill();
}

async function analyzeRecordingBlob(blob: Blob): Promise<RecordingAnalysis> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return analyzeRecordingSilence(audioBuffer);
  } finally {
    void audioContext.close();
  }
}

function analyzeRecordingSilence(buffer: AudioBuffer): RecordingAnalysis {
  const duration = buffer.duration;
  if (!Number.isFinite(duration) || duration <= 0) {
    return { duration: 0, trimRanges: [], skipRanges: [] };
  }

  const levels = getAudioPeakLevels(buffer, SILENCE_WINDOW_SECONDS);
  if (levels.length === 0) {
    return { duration, trimRanges: [], skipRanges: [] };
  }

  const sortedLevels = [...levels].sort((left, right) => left - right);
  const peakLevel = sortedLevels[sortedLevels.length - 1] ?? 0;
  const floorLevel = sortedLevels[Math.floor(sortedLevels.length * 0.2)] ?? 0;
  const threshold = clamp(
    Math.max(floorLevel * 3, peakLevel * 0.045, 0.008),
    0.008,
    Math.max(0.015, peakLevel * 0.5),
  );
  const loudWindows = levels
    .map((level, index) => (level >= threshold ? index : -1))
    .filter((index) => index >= 0);

  if (loudWindows.length === 0) {
    return {
      duration,
      trimRanges: [{ start: 0, end: duration }],
      skipRanges: [],
    };
  }

  const firstLoudWindow = loudWindows[0] ?? 0;
  const lastLoudWindow = loudWindows[loudWindows.length - 1] ?? 0;
  const speechStart = clamp(
    firstLoudWindow * SILENCE_WINDOW_SECONDS - DETECTION_START_BUFFER_SECONDS,
    0,
    duration,
  );
  const speechEnd = clamp(
    (lastLoudWindow + 1) * SILENCE_WINDOW_SECONDS +
      DETECTION_END_BUFFER_SECONDS,
    speechStart,
    duration,
  );
  const trimRanges = normalizeRanges([
    { start: 0, end: speechStart },
    { start: speechEnd, end: duration },
  ]);
  const skipRanges = detectLongInternalSilences({
    duration,
    levels,
    threshold,
    speechStart,
    speechEnd,
  });

  return {
    duration,
    trimRanges,
    skipRanges,
  };
}

function getAudioPeakLevels(buffer: AudioBuffer, windowSeconds: number) {
  const sampleRate = buffer.sampleRate;
  const channelCount = buffer.numberOfChannels;
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

  return levels;
}

function detectLongInternalSilences({
  duration,
  levels,
  threshold,
  speechStart,
  speechEnd,
}: {
  duration: number;
  levels: number[];
  threshold: number;
  speechStart: number;
  speechEnd: number;
}) {
  const startWindow = clamp(
    Math.floor(speechStart / SILENCE_WINDOW_SECONDS),
    0,
    levels.length - 1,
  );
  const endWindow = clamp(
    Math.ceil(speechEnd / SILENCE_WINDOW_SECONDS),
    startWindow + 1,
    levels.length,
  );
  const ranges: TimeRange[] = [];
  let silentRunStart = -1;

  for (let index = startWindow; index <= endWindow; index += 1) {
    const isLoud = index < endWindow && (levels[index] ?? 0) >= threshold;

    if (!isLoud) {
      if (silentRunStart === -1) silentRunStart = index;
      continue;
    }

    if (silentRunStart === -1) continue;

    const silentWindowCount = index - silentRunStart;
    const silentDuration = silentWindowCount * SILENCE_WINDOW_SECONDS;
    if (silentDuration > MAX_INTERNAL_SILENCE_SECONDS) {
      const rawSilenceStart = silentRunStart * SILENCE_WINDOW_SECONDS;
      const rawSilenceEnd = index * SILENCE_WINDOW_SECONDS;
      const skipStart = clamp(
        rawSilenceStart + MAX_INTERNAL_SILENCE_SECONDS / 2,
        speechStart,
        speechEnd,
      );
      const skipEnd = clamp(
        rawSilenceEnd - MAX_INTERNAL_SILENCE_SECONDS / 2,
        skipStart,
        speechEnd,
      );

      if (skipEnd - skipStart > 0.001) {
        ranges.push({ start: skipStart, end: clamp(skipEnd, 0, duration) });
      }
    }

    silentRunStart = -1;
  }

  return normalizeRanges(ranges);
}

function normalizeRanges(ranges: TimeRange[]) {
  const sortedRanges = ranges
    .filter((range) => range.end - range.start > 0.001)
    .sort((left, right) => left.start - right.start);
  const normalized: TimeRange[] = [];

  for (const range of sortedRanges) {
    const previous = normalized[normalized.length - 1];
    if (!previous || range.start > previous.end) {
      normalized.push({ ...range });
      continue;
    }
    previous.end = Math.max(previous.end, range.end);
  }

  return normalized;
}

function sumRangeDuration(ranges: TimeRange[]) {
  return ranges.reduce((total, range) => total + range.end - range.start, 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getRecordingLines(elements: StoryElement[]) {
  const lines: RecordingLine[] = [];
  let order = 1;

  for (const element of elements) {
    if (element.type !== "HEADER" && element.type !== "LINE") continue;
    const text = getElementText(element);
    if (!text) continue;

    lines.push({
      id: `${element.type}-${element.trackingProperties.line_index}-${order}`,
      order,
      lineIndex: element.trackingProperties.line_index || 0,
      type: element.type,
      speaker: getElementSpeaker(element),
      text,
    });
    order += 1;
  }

  return lines;
}

function getElementText(element: StoryElementHeader | StoryElementLine) {
  return element.type === "HEADER"
    ? element.learningLanguageTitleContent?.text
    : element.line.content?.text;
}

function getElementSpeaker(element: StoryElementHeader | StoryElementLine) {
  if (element.type === "HEADER" || element.line.type !== "CHARACTER") {
    return NARRATOR;
  }
  return (
    element.line.characterName ??
    element.line.characterId?.toString() ??
    NARRATOR
  );
}

function sortSpeakers(left: string, right: string) {
  if (left === NARRATOR) return -1;
  if (right === NARRATOR) return 1;
  return left.localeCompare(right);
}

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 100) / 10);
  return `${seconds.toFixed(1)}s`;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-16 px-2">
      <div className="text-lg font-bold leading-tight text-[var(--text-color)]">
        {value}
      </div>
      <div className="text-xs font-semibold uppercase text-[var(--text-color-dim)]">
        {label}
      </div>
    </div>
  );
}

function StoryNavButton({
  href,
  label,
  title,
  compactIconDirection,
}: {
  href?: string;
  label: string;
  title?: string;
  compactIconDirection: "left" | "right";
}) {
  const className =
    "px-3 py-2 text-center text-sm text-[var(--text-color-dim)] no-underline transition-colors hover:text-[var(--text-color)]";
  const content = (
    <>
      <span className="max-[1100px]:hidden">{label}</span>
      <span className="min-[1101px]:hidden">
        <ChevronIcon direction={compactIconDirection} />
      </span>
    </>
  );

  if (!href) {
    return (
      <span
        className={`${className} hidden min-[701px]:block min-[701px]:min-w-[48px] min-[1101px]:min-w-[86px] cursor-default opacity-50`}
        aria-disabled="true"
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${className} hidden min-[701px]:block min-[701px]:min-w-[48px] min-[1101px]:min-w-[86px]`}
      title={title ? `${label}: ${title}` : label}
    >
      {content}
    </Link>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <span aria-hidden="true" className="text-lg leading-none">
      {direction === "left" ? "‹" : "›"}
    </span>
  );
}
