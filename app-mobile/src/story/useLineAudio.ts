import React from "react";
import { playAudio } from "./audio";
import type { AudioInfo } from "./types";

const IDLE_AUDIO_RANGE = 99999;
const PENDING_AUDIO_RANGE = 0;

function getInitialAudioRange(audio: AudioInfo | undefined) {
  return audio?.url ? PENDING_AUDIO_RANGE : IDLE_AUDIO_RANGE;
}

/**
 * Per-line audio with keypoint-driven word highlighting, ported from the
 * web's use-audio hook. Active lines auto-play (the web queues autoplay on
 * every Continue press, which amounts to the same behavior).
 */
export function useLineAudio(
  audio: AudioInfo | undefined,
  active: boolean,
  autoPlay: boolean,
  replayKey = 0,
) {
  const [audioRange, setAudioRange] = React.useState(() =>
    getInitialAudioRange(audio),
  );

  React.useEffect(() => {
    setAudioRange(getInitialAudioRange(audio));
  }, [audio]);

  const play = React.useCallback(() => {
    setAudioRange(getInitialAudioRange(audio));
    playAudio(audio, { onRange: setAudioRange });
  }, [audio]);

  React.useEffect(() => {
    if (!active || !autoPlay) return;
    setAudioRange(getInitialAudioRange(audio));
    const timeout = setTimeout(() => {
      playAudio(audio, { onRange: setAudioRange });
    }, replayKey > 0 ? 0 : 350);
    return () => clearTimeout(timeout);
  }, [active, autoPlay, audio, replayKey]);

  return { audioRange, play, hasAudio: Boolean(audio?.url) };
}
