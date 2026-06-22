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
  const cancelRef = React.useRef<((resetRange?: boolean) => void) | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutoPlayRef = React.useRef(false);

  const clearScheduledPlay = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const cancelLineAudio = React.useCallback(
    (reveal: boolean) => {
      clearScheduledPlay();
      cancelRef.current?.(reveal);
      cancelRef.current = null;
      if (reveal) setAudioRange(IDLE_AUDIO_RANGE);
    },
    [clearScheduledPlay],
  );

  React.useEffect(() => {
    return () => cancelLineAudio(true);
  }, [cancelLineAudio]);

  React.useEffect(() => {
    cancelLineAudio(true);
    setAudioRange(getInitialAudioRange(audio));
  }, [audio, cancelLineAudio]);

  React.useEffect(() => {
    if (!active) cancelLineAudio(true);
  }, [active, cancelLineAudio]);

  const play = React.useCallback(() => {
    if (!active) skipNextAutoPlayRef.current = true;
    cancelLineAudio(false);
    setAudioRange(getInitialAudioRange(audio));
    cancelRef.current = playAudio(audio, { onRange: setAudioRange });
  }, [active, audio, cancelLineAudio]);

  React.useEffect(() => {
    if (!active || !autoPlay) return;
    if (skipNextAutoPlayRef.current) {
      skipNextAutoPlayRef.current = false;
      return;
    }
    cancelLineAudio(false);
    setAudioRange(getInitialAudioRange(audio));
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      cancelRef.current = playAudio(audio, { onRange: setAudioRange });
    }, replayKey > 0 ? 0 : 350);
    return clearScheduledPlay;
  }, [
    active,
    autoPlay,
    audio,
    replayKey,
    cancelLineAudio,
    clearScheduledPlay,
  ]);

  return { audioRange, play, hasAudio: Boolean(audio?.url) };
}
