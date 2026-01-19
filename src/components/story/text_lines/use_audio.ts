"use no memo";
import React from "react";
import { StoryContext } from "../story";
import type { StoryElementLine, StoryElementHeader, Audio } from "@/components/editor/story/syntax_parser_types";

// Extend window for playing_audio
declare global {
  interface Window {
    playing_audio?: (() => void)[];
  }
}

type UseAudioElement = StoryElementLine | StoryElementHeader;
type UseAudioReturn = [number, (() => Promise<void>) | undefined, React.RefObject<HTMLAudioElement | null>, string | undefined];

export default function useAudio(element: UseAudioElement, progress: number): UseAudioReturn {
  const [audioRange, setAudioRange] = React.useState(99999);
  let audio: Audio | undefined = element.type === "LINE"
    ? element?.line?.content?.audio
    : element?.learningLanguageTitleContent?.audio;
  const ref = React.useRef<HTMLAudioElement>(null);

  const controls = React.useContext(StoryContext);

  if (audio === undefined && element.type === "HEADER") {
    audio = element?.learningLanguageTitleContent?.audio;
  }

  const playAudio = React.useCallback(async () => {
    if (audio === undefined || !audio?.keypoints || !audio?.url) return;
    const audioObject = ref.current;
    if (!audioObject) return;
    if (window?.playing_audio) {
      for (const audio_cancel of window.playing_audio) audio_cancel();
    }
    window.playing_audio = [];
    audioObject.pause();
    audioObject.load();
    audioObject.currentTime = 0;
    try {
      await audioObject.play();
    } catch (e) {
      controls?.audio_failed_call();
      return;
    }
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let last_end = 0;
    for (const keypoint of audio.keypoints) {
      last_end = keypoint.rangeEnd;
      const t = setTimeout(() => {
        setAudioRange(keypoint.rangeEnd);
      }, keypoint.audioStart);
      timeouts.push(t);
    }

    setTimeout(
      () => {
        if (controls?.auto_play)
          controls.advance_progress(element.trackingProperties.line_index || 0);
      },
      audioObject.duration * 1000 - 150,
    );

    function cancel() {
      for (const t of timeouts) clearTimeout(t);
      setAudioRange(last_end);
      audioObject?.pause();
    }
    window.playing_audio.push(cancel);
  }, [audio, ref, controls, element.trackingProperties.line_index]);
  React.useEffect(() => {
    if (
      element.trackingProperties.line_index === progress ||
      (element.trackingProperties.line_index === undefined && progress === -1)
    )
      playAudio();
  }, [progress, playAudio]);

  if (audio === undefined || !audio?.keypoints || !audio?.url)
    return [audioRange, undefined, ref, undefined];

  return [
    audioRange,
    playAudio,
    ref,
    audio.url.startsWith("blob")
      ? audio.url
      : "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com/" + audio.url,
  ];
}
