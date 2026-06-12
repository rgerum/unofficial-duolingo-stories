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
    return [audioRange, undefined, ref, undefined] as const;
  }

  const audioUrl =
    audio.url.startsWith("blob") || audio.url.startsWith("http")
      ? audio.url
      : `https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/${audio.url}`;

  return [audioRange, playAudio, ref, audioUrl] as const;
}
