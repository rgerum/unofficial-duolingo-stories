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

export default function useAudio(element: UseAudioElement, active: boolean) {
  const [audioRange, setAudioRange] = React.useState(99999);
  const audio: Audio | undefined =
    element.type === "LINE"
      ? element.line?.content?.audio
      : element.learningLanguageTitleContent?.audio;
  const ref = React.useRef<HTMLAudioElement>(null);

  const playAudio = React.useCallback(async () => {
    if (!audio?.url || !ref.current) return;

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

    const timeouts: NodeJS.Timeout[] = [];

    // Set up keypoint timeouts (if available for word highlighting)
    audio.keypoints?.forEach((keypoint) => {
      const timeout = setTimeout(() => {
        setAudioRange(keypoint.rangeEnd);
      }, keypoint.audioStart);
      timeouts.push(timeout);
    });

    // Set up completion timeout
    const completionTimeout = window.setTimeout(
      () => {
        setAudioRange(9999);
        // Auto-advance logic would go here
      },
      audioObject.duration * 1000 - 150,
    );

    // Cleanup function
    const cancel = () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(completionTimeout);
      setAudioRange(99999);
      audioObject.pause();
    };

    window.playing_audio?.push(cancel);

    return cancel;
  }, [audio]);

  React.useEffect(() => {
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
  }, [active, element.type, playAudio]);

  if (!audio?.url) {
    return [audioRange, undefined, ref, undefined] as const;
  }

  const audioUrl = audio.url.startsWith("blob")
    ? audio.url
    : `https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/${audio.url}`;

  return [audioRange, playAudio, ref, audioUrl] as const;
}
