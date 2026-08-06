import React from "react";
import type {
  StoryElementLine,
  StoryElementHeader,
  Audio,
} from "@/components/editor/story/syntax_parser_types";

declare global {
  interface Window {
    playing_audio?: Array<() => void>;
  }
}

type UseAudioElement = StoryElementLine | StoryElementHeader;

export type PlayingWordRange = { start: number; end: number };

// Timing keypoints sit earlier than the actual speech in the encoded audio
// (MP3 encoder delay + TTS speech-mark skew). Measured against energy onsets
// across several courses, speech runs ~25-200ms (median ~75ms) behind its
// mark depending on the voice. Shift the playback window right: a small
// start shift trims the previous word's tail, and a larger end pad keeps
// word endings from being clipped (bleeding a soft next-word onset is less
// jarring than a cut-off ending).
const WORD_AUDIO_START_SHIFT_MS = 30;
const WORD_AUDIO_END_PAD_MS = 150;

export function getPlayableKeypoints(
  keypoints: Audio["keypoints"],
  durationSeconds: number,
) {
  if (!keypoints?.length) return [];
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return keypoints;
  }

  const durationMs = durationSeconds * 1000;
  return keypoints.filter(
    (keypoint) =>
      Number.isFinite(keypoint.audioStart) &&
      keypoint.audioStart >= 0 &&
      keypoint.audioStart <= durationMs,
  );
}

export default function useAudio(
  element: UseAudioElement,
  active: boolean,
  enabled = true,
) {
  const [audioRange, setAudioRange] = React.useState(99999);
  const [playingWordRange, setPlayingWordRange] =
    React.useState<PlayingWordRange | null>(null);
  const audio: Audio | undefined =
    element.type === "LINE"
      ? element.line?.content?.audio
      : element.learningLanguageTitleContent?.audio;
  const ref = React.useRef<HTMLAudioElement>(null);

  const playAudio = React.useCallback(async () => {
    if (!enabled || !audio?.url || !ref.current) return;

    const audioObject = ref.current;

    // Stop any currently playing audio
    if (window.playing_audio?.length) {
      window.playing_audio.forEach((cancel) => cancel());
    }

    window.playing_audio = [];

    try {
      audioObject.pause();
      audioObject.load();
      audioObject.currentTime = 0;
      await audioObject.play();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      console.error("Failed to play audio:", e);
      return;
    }

    const timeouts: number[] = [];
    let completionTimeout: number | undefined;

    const clearScheduledUpdates = () => {
      timeouts.forEach(clearTimeout);
      timeouts.length = 0;
      if (completionTimeout !== undefined) {
        clearTimeout(completionTimeout);
        completionTimeout = undefined;
      }
    };

    const completePlayback = () => {
      clearScheduledUpdates();
      setAudioRange(9999);
    };

    // Set up keypoint timeouts (if available for word highlighting)
    getPlayableKeypoints(audio.keypoints, audioObject.duration).forEach(
      (keypoint) => {
        const timeout = window.setTimeout(() => {
          setAudioRange(keypoint.rangeEnd);
        }, keypoint.audioStart);
        timeouts.push(timeout);
      },
    );

    // Set up completion timeout
    if (Number.isFinite(audioObject.duration) && audioObject.duration > 0) {
      completionTimeout = window.setTimeout(
        completePlayback,
        Math.max(0, audioObject.duration * 1000 - 150),
      );
    }

    audioObject.addEventListener("ended", completePlayback, { once: true });

    // Cleanup function
    const cancel = () => {
      clearScheduledUpdates();
      setAudioRange(99999);
      audioObject.removeEventListener("ended", completePlayback);
      audioObject.pause();
    };

    window.playing_audio?.push(cancel);

    return cancel;
  }, [audio, enabled]);

  // Play only the audio segment of the word at character offset `start`,
  // using the keypoint timestamps: a word's segment runs from its keypoint's
  // audioStart to the next keypoint's audioStart (or the end of the clip).
  const playWordAudio = React.useCallback(
    async (start: number) => {
      if (!enabled || !audio?.url || !ref.current) return;
      if (!audio.keypoints?.length) return;

      const audioObject = ref.current;

      // Stop any currently playing audio
      if (window.playing_audio?.length) {
        window.playing_audio.forEach((cancel) => cancel());
      }
      window.playing_audio = [];

      // Register the cancel handler before awaiting metadata so a newer
      // click (or full-line play) invalidates this pending request.
      let cancelled = false;
      let stopTimeout: number | undefined;
      const cancel = () => {
        cancelled = true;
        if (stopTimeout !== undefined) {
          clearTimeout(stopTimeout);
          stopTimeout = undefined;
        }
        audioObject.removeEventListener("ended", cancel);
        audioObject.pause();
        setPlayingWordRange(null);
      };
      window.playing_audio.push(cancel);

      let segmentStart: number;
      let segmentEnd: number | undefined;
      let wordRange: PlayingWordRange;
      try {
        audioObject.pause();
        if (audioObject.readyState < HTMLMediaElement.HAVE_METADATA) {
          audioObject.load();
          await new Promise<void>((resolve, reject) => {
            audioObject.addEventListener("loadedmetadata", () => resolve(), {
              once: true,
            });
            audioObject.addEventListener(
              "error",
              () => reject(new Error("Audio failed to load")),
              { once: true },
            );
          });
        }
        if (cancelled) return;

        const keypoints = getPlayableKeypoints(
          audio.keypoints,
          audioObject.duration,
        );
        if (!keypoints.length) return;
        let index = keypoints.findIndex(
          (keypoint) => keypoint.rangeEnd > start,
        );
        if (index === -1) index = keypoints.length - 1;
        segmentStart = keypoints[index].audioStart + WORD_AUDIO_START_SHIFT_MS;
        const nextStart = keypoints[index + 1]?.audioStart;
        segmentEnd =
          nextStart !== undefined
            ? nextStart + WORD_AUDIO_END_PAD_MS
            : undefined;
        wordRange = {
          start: keypoints[index - 1]?.rangeEnd ?? 0,
          end: keypoints[index].rangeEnd,
        };

        audioObject.currentTime = segmentStart / 1000;
        await audioObject.play();
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }
        console.error("Failed to play audio:", e);
        return;
      }
      if (cancelled) {
        audioObject.pause();
        return;
      }

      setPlayingWordRange(wordRange);

      if (segmentEnd !== undefined) {
        // Base the stop timer on the actual position after seeking, since
        // MP3 seeks are not sample-exact.
        stopTimeout = window.setTimeout(
          cancel,
          Math.max(0, segmentEnd - audioObject.currentTime * 1000),
        );
      }
      audioObject.addEventListener("ended", cancel, { once: true });
    },
    [audio, enabled],
  );

  React.useEffect(() => {
    if (!enabled) return;
    if (!active) return;
    if (typeof window === "undefined") return;

    if (element.type !== "HEADER" && element.type !== "LINE") return;

    const raw = window.sessionStorage.getItem("story_autoplay_ts");
    if (!raw) return;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return;
    if (Date.now() - ts > 10_000) return;

    window.sessionStorage.removeItem("story_autoplay_ts");
    playAudio();

    return () => {
      // Clean up any pending timeouts if component unmounts
      if (window.playing_audio?.length) {
        window.playing_audio.forEach((cancel) => cancel());
      }
    };
  }, [active, element.type, enabled, playAudio]);

  if (!audio?.url) {
    return [audioRange, undefined, ref, undefined, undefined, null] as const;
  }

  const audioUrl =
    audio.url.startsWith("blob") || audio.url.startsWith("http")
      ? audio.url
      : `https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/${audio.url}`;

  const hasWordTimings = (audio.keypoints?.length ?? 0) > 0;

  return [
    audioRange,
    playAudio,
    ref,
    audioUrl,
    hasWordTimings ? playWordAudio : undefined,
    playingWordRange,
  ] as const;
}
