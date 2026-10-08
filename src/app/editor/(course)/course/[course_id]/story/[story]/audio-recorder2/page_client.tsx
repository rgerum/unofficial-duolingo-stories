"use client";

import React from "react";
import { CircleStop, Mic, Pause, Play, RotateCcw } from "lucide-react";
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

type SpeakerSession = {
  speaker: string;
  lines: RecordingLine[];
};

type SessionStatus = "idle" | "listening" | "recording";

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
const VAD_START_RMS = 0.035;
const VAD_STOP_RMS = 0.018;
const VAD_STOP_SILENCE_MS = 720;
const VAD_MIN_SPEECH_MS = 180;

export default function AudioRecorder2PageClient({
  storyId,
  courseId,
}: {
  storyId: number;
  courseId: string;
}) {
  const router = useRouter();
  const [selectedSpeaker, setSelectedSpeaker] = React.useState<string | null>(
    null,
  );
  const [sessionStatus, setSessionStatus] =
    React.useState<SessionStatus>("idle");
  const [activeLineIndex, setActiveLineIndex] = React.useState(0);
  const [recordings, setRecordings] = React.useState<
    Record<string, RecordingDraft>
  >({});
  const [skippedLineIds, setSkippedLineIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [recorderError, setRecorderError] = React.useState<string | null>(null);
  const lineRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordingStartedAtRef = React.useRef(0);
  const [liveStream, setLiveStream] = React.useState<MediaStream | null>(null);
  const recordingsRef = React.useRef<Record<string, RecordingDraft>>({});
  const liveStreamRef = React.useRef<MediaStream | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const vadFrameRef = React.useRef(0);
  const lineChunksRef = React.useRef<Blob[]>([]);
  const speechStartedAtRef = React.useRef(0);
  const silenceStartedAtRef = React.useRef(0);
  const selectedSessionRef = React.useRef<SpeakerSession | null>(null);
  const activeLineIndexRef = React.useRef(0);
  const autoAdvanceRef = React.useRef(false);

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

  const sessions = React.useMemo<SpeakerSession[]>(() => {
    if (lines.length === 0) return [];

    const sessionMap = new Map<string, RecordingLine[]>();
    for (const line of lines) {
      const speakerLines = sessionMap.get(line.speaker) ?? [];
      speakerLines.push(line);
      sessionMap.set(line.speaker, speakerLines);
    }

    const speakerSessions = Array.from(sessionMap.entries())
      .sort(([left], [right]) => sortSpeakers(left, right))
      .map(([speaker, speakerLines]) => ({
        speaker,
        lines: speakerLines,
      }));

    return [
      {
        speaker: ALL_SPEAKERS,
        lines,
      },
      ...speakerSessions,
    ];
  }, [lines]);

  React.useEffect(() => {
    if (selectedSpeaker || sessions.length === 0) return;
    setSelectedSpeaker(sessions[0]?.speaker ?? null);
  }, [selectedSpeaker, sessions]);

  React.useEffect(() => {
    if (
      !selectedSpeaker ||
      sessions.some((session) => session.speaker === selectedSpeaker)
    ) {
      return;
    }
    setSelectedSpeaker(sessions[0]?.speaker ?? null);
  }, [selectedSpeaker, sessions]);

  const selectedSession =
    sessions.find((session) => session.speaker === selectedSpeaker) ?? null;
  const activeLine = selectedSession?.lines[activeLineIndex];
  const capturedCount = selectedSession
    ? selectedSession.lines.filter((line) => recordings[line.id]).length
    : 0;
  const skippedCount = selectedSession
    ? selectedSession.lines.filter((line) => skippedLineIds.has(line.id)).length
    : 0;
  const pendingCount = selectedSession
    ? Math.max(0, selectedSession.lines.length - capturedCount - skippedCount)
    : 0;
  const completedSessionCount = sessions.filter((session) =>
    session.lines.every(
      (line) => recordings[line.id] || skippedLineIds.has(line.id),
    ),
  ).length;
  const sessionProgress =
    selectedSession && selectedSession.lines.length > 0
      ? ((capturedCount + skippedCount) / selectedSession.lines.length) * 100
      : 0;

  React.useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);

  React.useEffect(() => {
    selectedSessionRef.current = selectedSession;
  }, [selectedSession]);

  React.useEffect(() => {
    activeLineIndexRef.current = activeLineIndex;
  }, [activeLineIndex]);

  React.useEffect(() => {
    return () => {
      cancelAnimationFrame(vadFrameRef.current);
      lineRecorderRef.current?.stream
        .getTracks()
        .forEach((track) => track.stop());
      lineRecorderRef.current = null;
      liveStreamRef.current?.getTracks().forEach((track) => track.stop());
      liveStreamRef.current = null;
      analyserRef.current?.disconnect();
      analyserRef.current = null;
      void audioContextRef.current?.close();
      audioContextRef.current = null;
      for (const recording of Object.values(recordingsRef.current)) {
        URL.revokeObjectURL(recording.url);
      }
    };
  }, []);

  const storeLineRecording = React.useCallback(
    (line: RecordingLine, blob: Blob) => {
      const durationMs = performance.now() - recordingStartedAtRef.current;
      setRecordings((current) => {
        const previous = current[line.id];
        if (previous) URL.revokeObjectURL(previous.url);
        return {
          ...current,
          [line.id]: {
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
            const recording = current[line.id];
            if (!recording || recording.blob !== blob) return current;
            return {
              ...current,
              [line.id]: {
                ...recording,
                analysis,
              },
            };
          });
        })
        .catch(() => {
          setRecordings((current) => {
            const recording = current[line.id];
            if (!recording || recording.blob !== blob) return current;
            return {
              ...current,
              [line.id]: {
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
    },
    [],
  );

  const finishCurrentLineRecording = React.useCallback(() => {
    const recorder = lineRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.stop();
  }, []);

  const startLineRecording = React.useCallback(
    (line: RecordingLine) => {
      const stream = liveStreamRef.current;
      if (!stream || lineRecorderRef.current?.state === "recording") return;

      lineChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      lineRecorderRef.current = recorder;
      recordingStartedAtRef.current = performance.now();

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) lineChunksRef.current.push(event.data);
      });
      recorder.addEventListener("stop", () => {
        const blob = new Blob(lineChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        lineChunksRef.current = [];
        lineRecorderRef.current = null;
        storeLineRecording(line, blob);
        setSkippedLineIds((current) => {
          const next = new Set(current);
          next.delete(line.id);
          return next;
        });
        if (!autoAdvanceRef.current) {
          cancelAnimationFrame(vadFrameRef.current);
          vadFrameRef.current = 0;
          liveStreamRef.current?.getTracks().forEach((track) => track.stop());
          liveStreamRef.current = null;
          setLiveStream(null);
          analyserRef.current?.disconnect();
          analyserRef.current = null;
          void audioContextRef.current?.close();
          audioContextRef.current = null;
          setSessionStatus("idle");
          return;
        }

        const session = selectedSessionRef.current;
        const isLastLine =
          activeLineIndexRef.current >= (session?.lines.length ?? 1) - 1;
        if (isLastLine) {
          cancelAnimationFrame(vadFrameRef.current);
          vadFrameRef.current = 0;
          liveStreamRef.current?.getTracks().forEach((track) => track.stop());
          liveStreamRef.current = null;
          setLiveStream(null);
          analyserRef.current?.disconnect();
          analyserRef.current = null;
          void audioContextRef.current?.close();
          audioContextRef.current = null;
          setSessionStatus("idle");
          return;
        }

        const nextIndex = activeLineIndexRef.current + 1;
        activeLineIndexRef.current = nextIndex;
        setActiveLineIndex(nextIndex);
        setSessionStatus((status) =>
          status === "idle" ? status : "listening",
        );
      });

      speechStartedAtRef.current = performance.now();
      silenceStartedAtRef.current = 0;
      setSessionStatus("recording");
      recorder.start();
    },
    [storeLineRecording],
  );

  const stopSessionResources = React.useCallback(() => {
    cancelAnimationFrame(vadFrameRef.current);
    vadFrameRef.current = 0;
    if (lineRecorderRef.current?.state === "recording") {
      lineRecorderRef.current.stop();
    }
    liveStreamRef.current?.getTracks().forEach((track) => track.stop());
    liveStreamRef.current = null;
    setLiveStream(null);
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    autoAdvanceRef.current = false;
    setSessionStatus("idle");
  }, []);

  const runVoiceActivityLoop = React.useCallback(
    (timestamp: number) => {
      const analyser = analyserRef.current;
      const session = selectedSessionRef.current;
      if (!analyser || !session) return;

      const activeIndex = activeLineIndexRef.current;
      const line = session.lines[activeIndex];
      if (!line) {
        stopSessionResources();
        return;
      }

      const rms = getAnalyserRms(analyser);
      const recorder = lineRecorderRef.current;
      const isRecordingLine = recorder?.state === "recording";

      if (!isRecordingLine && rms >= VAD_START_RMS) {
        startLineRecording(line);
      } else if (isRecordingLine) {
        if (rms < VAD_STOP_RMS) {
          if (silenceStartedAtRef.current === 0) {
            silenceStartedAtRef.current = timestamp;
          }
          const speechDuration = timestamp - speechStartedAtRef.current;
          const silenceDuration = timestamp - silenceStartedAtRef.current;
          if (
            speechDuration >= VAD_MIN_SPEECH_MS &&
            silenceDuration >= VAD_STOP_SILENCE_MS
          ) {
            finishCurrentLineRecording();
          }
        } else {
          silenceStartedAtRef.current = 0;
        }
      }

      vadFrameRef.current = requestAnimationFrame(runVoiceActivityLoop);
    },
    [finishCurrentLineRecording, startLineRecording, stopSessionResources],
  );

  const startRecording = React.useCallback(
    async (autoAdvance: boolean) => {
      if (!selectedSession || sessionStatus !== "idle") return;
      setRecorderError(null);
      autoAdvanceRef.current = autoAdvance;
      setSessionStatus("listening");

      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setSessionStatus("idle");
        setRecorderError("This browser does not support in-page recording.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        analyser.fftSize = 1024;
        source.connect(analyser);
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        liveStreamRef.current = stream;
        setLiveStream(stream);
        vadFrameRef.current = requestAnimationFrame(runVoiceActivityLoop);
      } catch (error) {
        stopSessionResources();
        setLiveStream(null);
        setRecorderError(
          error instanceof Error
            ? error.message
            : "Microphone permission was not granted.",
        );
      }
    },
    [
      runVoiceActivityLoop,
      selectedSession,
      sessionStatus,
      stopSessionResources,
    ],
  );

  const stopRecording = React.useCallback(() => {
    stopSessionResources();
  }, [stopSessionResources]);

  const resetCurrentRecording = React.useCallback(() => {
    if (!activeLine) return;
    setRecordings((current) => {
      const existing = current[activeLine.id];
      if (existing) URL.revokeObjectURL(existing.url);
      const next = { ...current };
      delete next[activeLine.id];
      return next;
    });
    setSkippedLineIds((current) => {
      const next = new Set(current);
      next.delete(activeLine.id);
      return next;
    });
  }, [activeLine]);

  const skipActiveLine = React.useCallback(() => {
    if (!activeLine || !selectedSession) return;
    setSkippedLineIds((current) => {
      const next = new Set(current);
      next.add(activeLine.id);
      return next;
    });
    setActiveLineIndex((index) =>
      Math.min(index + 1, selectedSession.lines.length - 1),
    );
  }, [activeLine, selectedSession]);

  const redoLine = React.useCallback((line: RecordingLine, index: number) => {
    setActiveLineIndex(index);
    setSkippedLineIds((current) => {
      const next = new Set(current);
      next.delete(line.id);
      return next;
    });
    setRecordings((current) => {
      const existing = current[line.id];
      if (existing) URL.revokeObjectURL(existing.url);
      const next = { ...current };
      delete next[line.id];
      return next;
    });
  }, []);

  const activeRecording = activeLine ? recordings[activeLine.id] : undefined;
  const isRecordingCurrent = sessionStatus !== "idle";
  const loading = data === undefined || course === undefined;
  const readyForLines = data && avatarRows && learningLanguage && fromLanguage;
  const statusText =
    sessionStatus === "idle"
      ? "Ready"
      : sessionStatus === "recording"
        ? "Recording - pause briefly when done."
        : "Listening - start speaking.";

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
              { type: "Audio recorder 2" },
            ]}
          />
        </EditorHeaderBreadcrumbs>
      ) : null}
      <EditorHeaderActions>
        <div className="flex items-center">
          <StoryNavButton
            href={
              previousStory && coursePathId
                ? `/editor/course/${coursePathId}/story/${previousStory.id}/audio-recorder2`
                : undefined
            }
            label="Previous"
            title={previousStory?.name}
            compactIconDirection="left"
          />
          <StoryNavButton
            href={
              nextStory && coursePathId
                ? `/editor/course/${coursePathId}/story/${nextStory.id}/audio-recorder2`
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
                One-shot audio recorder
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[var(--text-color)]">
                {data?.story_data.name ?? "Loading story..."}
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-md border border-[var(--overview-hr)] bg-[var(--body-background-faint)] p-2 text-center">
              <Stat label="Speakers" value={sessions.length} />
              <Stat label="Done" value={completedSessionCount} />
              <Stat label="Lines" value={selectedSession?.lines.length ?? 0} />
            </div>
          </section>

          <section className="flex flex-wrap gap-2" aria-label="Speaker filter">
            {sessions.map((session) => (
              <button
                key={session.speaker}
                type="button"
                className={cn(
                  "h-9 rounded-md border px-3 text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-60",
                  selectedSpeaker === session.speaker
                    ? "border-[#0f5f83] bg-[#1cb0f6] text-white"
                    : "border-[var(--overview-hr)] bg-[var(--body-background-faint)] text-[var(--text-color)] hover:border-[var(--link-blue)]",
                )}
                disabled={sessionStatus !== "idle"}
                onClick={() => {
                  setSelectedSpeaker(session.speaker);
                  setActiveLineIndex(0);
                }}
              >
                {session.speaker}
                <span className="ml-2 opacity-75">{session.lines.length}</span>
              </button>
            ))}
          </section>

          <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-h-[420px] flex-col justify-between rounded-md border border-[var(--overview-hr)] bg-[var(--body-background-faint)] p-4 shadow-sm sm:p-6">
              {loading || !readyForLines ? (
                <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-color-dim)]">
                  Loading recording lines...
                </div>
              ) : selectedSession ? (
                <>
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-[var(--editor-ssml)] px-2 py-1 text-xs font-bold uppercase text-[var(--text-color)]">
                            {selectedSession.speaker}
                          </span>
                          <span className="text-sm text-[var(--text-color-dim)]">
                            {selectedSession.lines.length} lines
                          </span>
                        </div>
                        <h2 className="mt-5 text-xl font-bold text-[var(--text-color)]">
                          Recording session
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-color-dim)]">
                          {capturedCount} captured · {skippedCount} skipped ·{" "}
                          {pendingCount} pending
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-md border border-[var(--overview-hr)] bg-[var(--body-background)] px-4 py-2 text-sm font-bold text-[var(--text-color-dim)] transition-colors hover:text-[var(--text-color)]"
                        onClick={stopRecording}
                        disabled={sessionStatus === "idle"}
                      >
                        Close
                      </button>
                    </div>

                    <div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--overview-hr)]">
                        <div
                          className="h-full rounded-full bg-[#1cb0f6] transition-[width]"
                          style={{ width: `${sessionProgress}%` }}
                        />
                      </div>
                      <p
                        className={cn(
                          "mt-3 text-sm font-bold",
                          sessionStatus === "recording"
                            ? "text-[#ce1235]"
                            : "text-[var(--text-color-dim)]",
                        )}
                      >
                        <span
                          className={cn(
                            "mr-2 inline-block h-2.5 w-2.5 rounded-full",
                            sessionStatus === "idle"
                              ? "bg-[var(--overview-hr)]"
                              : sessionStatus === "recording"
                                ? "bg-[#ce1235]"
                                : "bg-[#1cb0f6]",
                          )}
                        />
                        {statusText}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
                      <button
                        type="button"
                        className={cn(
                          "flex min-h-28 items-center justify-center rounded-md border text-xl font-bold transition-colors",
                          sessionStatus === "idle"
                            ? "border-[#0f5f83] bg-[#1cb0f6] text-white hover:bg-[#1598d7]"
                            : "border-[#9b1c1c] bg-[#f7a3a3] text-[#9b1c1c]",
                        )}
                        onClick={
                          sessionStatus === "idle"
                            ? () => startRecording(false)
                            : stopRecording
                        }
                      >
                        {sessionStatus === "idle" ? (
                          <span className="inline-flex items-center gap-2">
                            <Mic size={24} aria-hidden="true" />
                            Record
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <CircleStop size={24} aria-hidden="true" />
                            Stop
                          </span>
                        )}
                      </button>
                      <div className="flex min-h-28 flex-col items-center justify-center rounded-md border border-[var(--overview-hr)] bg-[var(--body-background)] px-4 py-5 text-center">
                        <p className="text-3xl font-bold leading-tight text-[var(--text-color)]">
                          {activeLine?.text ?? "Done"}
                        </p>
                        <p className="mt-3 text-sm text-[var(--text-color-dim)]">
                          {selectedSession.lines[activeLineIndex + 1]
                            ? `Next: ${selectedSession.lines[activeLineIndex + 1]?.text}`
                            : "Last line"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-4">
                    {recorderError ? (
                      <div className="rounded-md border border-[#ea8b8b] bg-[#fff0f0] px-3 py-2 text-sm font-medium text-[#9b1c1c]">
                        {recorderError}
                      </div>
                    ) : null}
                    {isRecordingCurrent ? (
                      <LiveRecordingWaveform
                        key={activeLine?.id ?? "session"}
                        stream={liveStream}
                        status={sessionStatus}
                      />
                    ) : activeRecording ? (
                      <RecordingWaveform
                        key={activeRecording.url}
                        url={activeRecording.url}
                        durationMs={activeRecording.durationMs}
                        analysis={activeRecording.analysis}
                      />
                    ) : (
                      <div className="h-12 rounded-md border border-dashed border-[var(--overview-hr)] px-3 py-3 text-sm text-[var(--text-color-dim)]">
                        No session take recorded for this speaker.
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          primary
                          onClick={() => startRecording(true)}
                          disabled={sessionStatus !== "idle"}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Mic size={18} aria-hidden="true" />
                            Start session
                          </span>
                        </Button>
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
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={skipActiveLine}
                          disabled={!activeLine}
                        >
                          Skip
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
                  No speaker lines found.
                </div>
              )}
            </div>

            <aside className="min-h-0 rounded-md border border-[var(--overview-hr)] bg-[var(--body-background-faint)] p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase text-[var(--text-color-dim)]">
                  Lines
                </h2>
                <span className="text-xs text-[var(--text-color-dim)]">
                  Auto-advance
                </span>
              </div>
              <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                {selectedSession?.lines.map((line, index) => {
                  const isCaptured = Boolean(recordings[line.id]);
                  const isSkipped = skippedLineIds.has(line.id);
                  const isActive = index === activeLineIndex;
                  return (
                    <div
                      key={line.id}
                      className={cn(
                        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border p-2 transition-colors",
                        isActive
                          ? "border-[#1cb0f6] bg-[color:color-mix(in_srgb,#1cb0f6_12%,var(--body-background))]"
                          : "border-[var(--overview-hr)] bg-[var(--body-background)]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          isCaptured
                            ? "bg-[#ddf4cc] text-[#3c7800]"
                            : isSkipped
                              ? "bg-[var(--overview-hr)] text-[var(--text-color-dim)]"
                              : isActive
                                ? "bg-[#ce1235] text-white"
                                : "bg-transparent text-[var(--text-color-dim)]",
                        )}
                      >
                        {isCaptured ? "✓" : isSkipped ? "-" : index + 1}
                      </span>
                      <button
                        type="button"
                        className="min-w-0 text-left"
                        onClick={() => setActiveLineIndex(index)}
                      >
                        <span className="block truncate text-sm font-semibold text-[var(--text-color)]">
                          {line.text}
                        </span>
                        <span className="block truncate text-xs text-[var(--text-color-dim)]">
                          {line.speaker}
                        </span>
                      </button>
                      <div className="flex gap-1">
                        {isCaptured || isSkipped ? (
                          <button
                            type="button"
                            className="rounded-md border border-[var(--overview-hr)] px-2 py-1 text-xs font-semibold text-[var(--text-color-dim)] hover:text-[var(--text-color)]"
                            onClick={() => redoLine(line, index)}
                          >
                            Redo
                          </button>
                        ) : null}
                        {!isCaptured ? (
                          <button
                            type="button"
                            className="rounded-md border border-[var(--overview-hr)] px-2 py-1 text-xs font-semibold text-[var(--text-color-dim)] hover:text-[var(--text-color)]"
                            onClick={() => {
                              setActiveLineIndex(index);
                              setSkippedLineIds((current) => {
                                const next = new Set(current);
                                next.add(line.id);
                                return next;
                              });
                            }}
                          >
                            Skip
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </section>

          <nav className="flex items-center justify-center border-t border-[var(--overview-hr)] pt-4">
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

function LiveRecordingWaveform({
  stream,
  status,
}: {
  stream: MediaStream | null;
  status: SessionStatus;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [volume, setVolume] = React.useState(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stream) {
      setVolume(0);
      return;
    }

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
        const normalizedVolume = Math.min(1, rms * 8);
        setVolume(normalizedVolume);
        samples.push(Math.min(1, rms * 5.5));
        if (samples.length > maxBars) samples.shift();
        lastSampleAt = timestamp;
      }

      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(28, 176, 246, 0.08)";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#1cb0f6";

      for (let index = 0; index < samples.length; index += 1) {
        const amplitude = Math.max(0.08, samples[index]);
        const barHeight = amplitude * (height - 16);
        const x = index * step;
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
      <div className="flex flex-col items-center gap-2">
        <span className="relative flex h-11 w-11 items-center justify-center">
          <span className="absolute h-11 w-11 animate-ping rounded-full bg-[#ce1235]/25" />
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#9b1c1c] bg-[#f7a3a3] text-[#9b1c1c]">
            <Mic size={18} aria-hidden="true" />
          </span>
        </span>
        <span className="text-[10px] font-bold uppercase text-[var(--text-color-dim)]">
          {status === "recording" ? "Rec" : "Armed"}
        </span>
      </div>
      <div className="min-w-0">
        <div className="mb-2 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
          <span className="text-xs font-bold uppercase text-[var(--text-color-dim)]">
            Input
          </span>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--overview-hr)]">
            <div
              className={cn(
                "h-full rounded-full transition-[width,background-color]",
                volume > 0.78
                  ? "bg-[#ce1235]"
                  : volume > 0.38
                    ? "bg-[#58a700]"
                    : "bg-[#1cb0f6]",
              )}
              style={{ width: `${Math.max(3, volume * 100)}%` }}
            />
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={900}
          height={72}
          className="h-[72px] w-full min-w-0 max-w-full rounded-md bg-[color:color-mix(in_srgb,var(--body-background-faint)_72%,transparent)]"
          aria-label="Live recording waveform"
        />
      </div>
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

function getAnalyserRms(analyser: AnalyserNode) {
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (const value of data) {
    const centered = (value - 128) / 128;
    sum += centered * centered;
  }
  return Math.sqrt(sum / data.length);
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

function getDetectedSpeechRegionCount(analysis: RecordingAnalysis) {
  const removedRanges = normalizeRanges([
    ...analysis.trimRanges,
    ...analysis.skipRanges,
  ]);
  if (analysis.duration <= 0) return 0;
  if (removedRanges.length === 0) return 1;

  let count = 0;
  let cursor = 0;
  for (const range of removedRanges) {
    if (range.start - cursor > 0.1) count += 1;
    cursor = Math.max(cursor, range.end);
  }
  if (analysis.duration - cursor > 0.1) count += 1;
  return count;
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
