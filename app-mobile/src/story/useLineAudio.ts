import React from "react";
import { AppState } from "react-native";
import {
  claimAudioHighlight,
  ownsAudioHighlight,
  releaseAudioHighlight,
  subscribeToAudioHighlightOwner,
} from "./audioHighlightOwner";
import { playAudio } from "./audio";
import type { AudioInfo } from "./types";

const PENDING_AUDIO_RANGE = 0;
const IDLE_AUDIO_RANGE = 99999;

function canHighlightAudio(audio: AudioInfo | undefined) {
  return Boolean(audio?.url && audio.keypoints?.length);
}

function normalizeAudioRange(range: number) {
  return range >= IDLE_AUDIO_RANGE ? undefined : range;
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
  const highlightOwnerRef = React.useRef(Symbol("line-audio-highlight"));
  const [audioRange, setAudioRange] = React.useState<number | undefined>(
    undefined,
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
      releaseAudioHighlight(highlightOwnerRef.current);
      if (reveal) setAudioRange(undefined);
    },
    [clearScheduledPlay],
  );

  React.useEffect(() => {
    return () => cancelLineAudio(true);
  }, [cancelLineAudio]);

  React.useEffect(() => {
    cancelLineAudio(true);
    if (!audio) return;
    setAudioRange(undefined);
  }, [audio, cancelLineAudio]);

  React.useEffect(() => {
    if (!active) cancelLineAudio(true);
  }, [active, cancelLineAudio]);

  React.useEffect(() => {
    return subscribeToAudioHighlightOwner((owner) => {
      if (owner !== highlightOwnerRef.current) setAudioRange(undefined);
    });
  }, []);

  const beginHighlight = React.useCallback(() => {
    if (!canHighlightAudio(audio)) {
      releaseAudioHighlight(highlightOwnerRef.current);
      setAudioRange(undefined);
      return;
    }
    claimAudioHighlight(highlightOwnerRef.current);
    setAudioRange(PENDING_AUDIO_RANGE);
  }, [audio]);

  const handleRange = React.useCallback((range: number) => {
    if (!ownsAudioHighlight(highlightOwnerRef.current)) return;
    const nextRange = normalizeAudioRange(range);
    setAudioRange(nextRange);
    if (nextRange === undefined)
      releaseAudioHighlight(highlightOwnerRef.current);
  }, []);

  const play = React.useCallback(() => {
    if (!active) skipNextAutoPlayRef.current = true;
    cancelLineAudio(false);
    beginHighlight();
    cancelRef.current = playAudio(audio, {
      onRange: handleRange,
    });
  }, [active, audio, beginHighlight, cancelLineAudio, handleRange]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") cancelLineAudio(true);
    });
    return () => subscription.remove();
  }, [cancelLineAudio]);

  React.useEffect(() => {
    if (!active || !autoPlay) return;
    if (skipNextAutoPlayRef.current) {
      skipNextAutoPlayRef.current = false;
      return;
    }
    cancelLineAudio(false);
    timeoutRef.current = setTimeout(
      () => {
        timeoutRef.current = null;
        beginHighlight();
        cancelRef.current = playAudio(audio, {
          onRange: handleRange,
        });
      },
      replayKey > 0 ? 0 : 350,
    );
    return clearScheduledPlay;
  }, [
    active,
    autoPlay,
    audio,
    replayKey,
    beginHighlight,
    cancelLineAudio,
    clearScheduledPlay,
    handleRange,
  ]);

  return { audioRange, play, hasAudio: Boolean(audio?.url) };
}
