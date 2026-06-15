import React from "react";
import { playAudio } from "./audio";
import type { AudioInfo } from "./types";

/**
 * Per-line audio with keypoint-driven word highlighting, ported from the
 * web's use-audio hook. Active lines auto-play (the web queues autoplay on
 * every Continue press, which amounts to the same behavior).
 */
export function useLineAudio(
  audio: AudioInfo | undefined,
  active: boolean,
  autoPlay: boolean,
) {
  const [audioRange, setAudioRange] = React.useState(99999);

  const play = React.useCallback(() => {
    playAudio(audio, { onRange: setAudioRange });
  }, [audio]);

  React.useEffect(() => {
    if (!active || !autoPlay) return;
    const timeout = setTimeout(() => {
      playAudio(audio, { onRange: setAudioRange });
    }, 350);
    return () => clearTimeout(timeout);
  }, [active, autoPlay, audio]);

  return { audioRange, play, hasAudio: Boolean(audio?.url) };
}
