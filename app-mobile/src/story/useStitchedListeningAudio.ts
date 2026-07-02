import React from "react";
import { createAudioPlayer } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import { stopAudio } from "./audio";
import type { StoryData } from "./types";

const STATUS_UPDATE_INTERVAL_MS = 50;
const FETCH_TIMEOUT_MS = 2500;
const PLAYBACK_START_TIMEOUT_MS = 3000;

type StitchedAudioStatus = "disabled" | "loading" | "ready" | "unavailable";

type StitchedSegment = {
  partIndex: number;
  startMs: number;
  endMs: number;
  keypoints?: { rangeEnd: number; startMs: number }[];
};

type StitchedManifest = {
  storyId: number;
  audio: { filename: string };
  durationMs: number;
  segments: StitchedSegment[];
};

type CourseSummary = {
  results: {
    storyId: number;
    status: string;
    outputDir?: string;
  }[];
};

type ResolvedManifest = {
  manifest: StitchedManifest;
  audioUrl: string;
};

const rootUrl = process.env.EXPO_PUBLIC_STITCHED_AUDIO_ROOT_URL?.replace(
  /\/+$/,
  "",
);

function trimLeadingTmp(path: string) {
  return path.replace(/^tmp\//, "");
}

function joinUrl(...parts: string[]) {
  return parts
    .map((part, index) =>
      index === 0 ? part.replace(/\/+$/, "") : part.replace(/^\/+|\/+$/g, ""),
    )
    .filter(Boolean)
    .join("/");
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveManifest(story: StoryData): Promise<ResolvedManifest | null> {
  if (!rootUrl) return null;

  const summaryCandidates = [
    {
      url: joinUrl(rootUrl, "story-audio", "courses", story.course_short, "summary.json"),
      stripTmp: true,
    },
    {
      url: joinUrl(
        rootUrl,
        "tmp",
        "story-audio",
        "courses",
        story.course_short,
        "summary.json",
      ),
      stripTmp: false,
    },
  ];

  for (const candidate of summaryCandidates) {
    try {
      const summary = await fetchJson<CourseSummary>(candidate.url);
      const result = summary.results.find(
        (item) => item.storyId === story.id && item.status === "ok" && item.outputDir,
      );
      if (!result?.outputDir) return null;

      const outputDir = candidate.stripTmp
        ? trimLeadingTmp(result.outputDir)
        : result.outputDir;
      const manifestUrl = joinUrl(rootUrl, outputDir, "joined.audio.json");
      const manifest = await fetchJson<StitchedManifest>(manifestUrl);
      return {
        manifest,
        audioUrl: joinUrl(rootUrl, outputDir, manifest.audio.filename),
      };
    } catch {
      // Try the next root layout. This is a temporary local-hosting path.
    }
  }

  return null;
}

function getActiveSegment(
  segments: StitchedSegment[],
  currentTimeMs: number,
): StitchedSegment | undefined {
  let active: StitchedSegment | undefined;
  for (const segment of segments) {
    if (segment.startMs <= currentTimeMs) active = segment;
    else break;
  }
  return active;
}

function getAudioRange(
  segment: StitchedSegment | undefined,
  currentTimeMs: number,
): number | undefined {
  if (!segment?.keypoints?.length) return undefined;

  let rangeEnd: number | undefined;
  let latestStart = Number.NEGATIVE_INFINITY;
  for (const keypoint of segment.keypoints) {
    if (keypoint.startMs <= currentTimeMs && keypoint.startMs >= latestStart) {
      latestStart = keypoint.startMs;
      rangeEnd = keypoint.rangeEnd;
    }
  }
  return rangeEnd;
}

export function useStitchedListeningAudio({
  enabled,
  story,
  paused,
  onPartChange,
  onFinished,
}: {
  enabled: boolean;
  story: StoryData;
  paused: boolean;
  onPartChange: (partIndex: number) => void;
  onFinished: () => void;
}) {
  const [status, setStatus] = React.useState<StitchedAudioStatus>(
    rootUrl ? "loading" : "disabled",
  );
  const [audioRange, setAudioRange] = React.useState<number | undefined>();
  const manifestRef = React.useRef<StitchedManifest | null>(null);
  const playerRef = React.useRef<AudioPlayer | null>(null);
  const subscriptionRef = React.useRef<{ remove: () => void } | null>(null);
  const activePartRef = React.useRef<number | null>(null);
  const finishedRef = React.useRef(false);
  const pausedRef = React.useRef(paused);
  pausedRef.current = paused;

  const cleanup = React.useCallback(() => {
    const player = playerRef.current;
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    playerRef.current = null;
    manifestRef.current = null;
    activePartRef.current = null;
    finishedRef.current = false;
    setAudioRange(undefined);
    if (player) {
      try {
        player.pause();
        player.remove();
      } catch {}
    }
  }, []);

  React.useEffect(() => cleanup, [cleanup]);

  React.useEffect(() => {
    cleanup();
    if (!enabled || !rootUrl) {
      setStatus(rootUrl ? "disabled" : "unavailable");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    void resolveManifest(story)
      .then((resolved) => {
        if (cancelled) return;
        if (!resolved) {
          setStatus("unavailable");
          return;
        }

        stopAudio(false);
        manifestRef.current = resolved.manifest;
        const player = createAudioPlayer(
          { uri: resolved.audioUrl },
          { updateInterval: STATUS_UPDATE_INTERVAL_MS },
        );
        playerRef.current = player;
        let activated = false;
        const startupTimeout = setTimeout(() => {
          if (activated || cancelled) return;
          setStatus("unavailable");
          cleanup();
        }, PLAYBACK_START_TIMEOUT_MS);

        const subscription = player.addListener("playbackStatusUpdate", (status) => {
          const manifest = manifestRef.current;
          if (!manifest) return;

          if (!activated && (status.playing || status.currentTime > 0)) {
            activated = true;
            clearTimeout(startupTimeout);
            stopAudio(false);
            setStatus("ready");
          }

          const currentTimeMs = Math.max(status.currentTime, player.currentTime) * 1000;
          const segment = getActiveSegment(manifest.segments, currentTimeMs);
          if (segment && segment.partIndex !== activePartRef.current) {
            activePartRef.current = segment.partIndex;
            onPartChange(segment.partIndex);
          }
          setAudioRange(getAudioRange(segment, currentTimeMs));

          if (status.didJustFinish && !finishedRef.current) {
            finishedRef.current = true;
            setAudioRange(undefined);
            onFinished();
          }
        });
        subscriptionRef.current = subscription;
        if (!pausedRef.current) player.play();
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cleanup, enabled, onFinished, onPartChange, story]);

  React.useEffect(() => {
    if (status !== "ready") return;
    const player = playerRef.current;
    if (!player) return;
    if (paused) player.pause();
    else player.play();
  }, [paused, status]);

  const replay = React.useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    finishedRef.current = false;
    void player.seekTo(0).then(() => {
      activePartRef.current = null;
      onPartChange(0);
      player.play();
    });
  }, [onPartChange]);

  const skipToNext = React.useCallback(() => {
    const player = playerRef.current;
    const manifest = manifestRef.current;
    if (!player || !manifest) return false;

    const currentTimeMs = player.currentTime * 1000;
    const nextSegment = manifest.segments.find(
      (segment) => segment.startMs > currentTimeMs + 100,
    );
    if (!nextSegment) {
      finishedRef.current = true;
      onFinished();
      return true;
    }

    void player.seekTo(nextSegment.startMs / 1000).then(() => {
      activePartRef.current = nextSegment.partIndex;
      onPartChange(nextSegment.partIndex);
      player.play();
    });
    return true;
  }, [onFinished, onPartChange]);

  return {
    status,
    audioRange,
    isReady: status === "ready",
    isUnavailable: status === "unavailable" || status === "disabled",
    replay,
    skipToNext,
  };
}
