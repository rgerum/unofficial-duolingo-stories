import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioInfo } from "./types";

const BLOB_BASE = "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com";
const AUDIO_STATUS_UPDATE_INTERVAL_MS = 50;
const IDLE_AUDIO_RANGE = 99999;

function getPlaybackRange(
  keypoints: AudioInfo["keypoints"],
  currentTimeSeconds: number,
): number | undefined {
  if (!keypoints?.length) return undefined;

  const currentTimeMs = currentTimeSeconds * 1000;
  let rangeEnd: number | undefined;
  let latestAudioStart = Number.NEGATIVE_INFINITY;
  for (const keypoint of keypoints) {
    if (
      Number.isFinite(keypoint.audioStart) &&
      Number.isFinite(keypoint.rangeEnd) &&
      keypoint.audioStart <= currentTimeMs &&
      keypoint.audioStart >= latestAudioStart
    ) {
      latestAudioStart = keypoint.audioStart;
      rangeEnd = keypoint.rangeEnd;
    }
  }
  return rangeEnd;
}

export function resolveAudioUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("blob")) return url;
  return `${BLOB_BASE}/${url}`;
}

export async function configureAudioSession(): Promise<void> {
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch {
    // non-fatal: audio still plays with the default session
  }
}

type PlayHandlers = {
  /** Called with the highest spoken character index (keypoint highlighting). */
  onRange?: (rangeEnd: number) => void;
  onDone?: () => void;
};

// Only one line plays at a time — the mobile equivalent of the web's
// window.playing_audio cancel stack.
let cancelCurrent: ((resetRange?: boolean) => void) | null = null;

// Listening mode subscribes here to auto-advance when a line finishes.
type DoneListener = () => void;
const doneListeners = new Set<DoneListener>();

export function onAnyAudioDone(listener: DoneListener): () => void {
  doneListeners.add(listener);
  return () => doneListeners.delete(listener);
}

function emitDone() {
  for (const listener of [...doneListeners]) listener();
}

export function stopAudio(resetRange = true): void {
  cancelCurrent?.(resetRange);
  cancelCurrent = null;
}

/**
 * Plays a line's audio, driving word highlighting from the native playback
 * clock. The audio keeps playing when the JS thread is busy; deriving the
 * range from currentTime lets the next status update catch up instead of
 * firing stale keypoint timers late.
 *
 * Returns a cancel function.
 * Lines without audio emit "done" after a short pause so listening mode
 * still advances.
 */
export function playAudio(
  audio: AudioInfo | undefined,
  handlers: PlayHandlers = {},
): () => void {
  stopAudio();

  const url = resolveAudioUrl(audio?.url);
  if (!url) {
    const timeout = setTimeout(() => {
      handlers.onDone?.();
      emitDone();
    }, 1200);
    const cancel = () => clearTimeout(timeout);
    cancelCurrent = cancel;
    return cancel;
  }

  const player = createAudioPlayer(
    { uri: url },
    { updateInterval: AUDIO_STATUS_UPDATE_INTERVAL_MS },
  );
  let finished = false;
  let cleanedUp = false;
  let latestRange: number | undefined;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    subscription.remove();
    try {
      player.release();
    } catch {}
    if (cancelCurrent === cancel) cancelCurrent = null;
  };

  const cancel = (resetRange = true) => {
    if (resetRange) handlers.onRange?.(IDLE_AUDIO_RANGE);
    try {
      player.pause();
    } catch {}
    cleanup();
  };

  const syncRangeToPlaybackTime = (currentTimeSeconds: number) => {
    const range = getPlaybackRange(audio?.keypoints, currentTimeSeconds);
    if (range === undefined || range === latestRange) return;
    latestRange = range;
    handlers.onRange?.(range);
  };

  const subscription = player.addListener("playbackStatusUpdate", (status) => {
    syncRangeToPlaybackTime(Math.max(status.currentTime, player.currentTime));

    if (status.didJustFinish && !finished) {
      finished = true;
      handlers.onRange?.(IDLE_AUDIO_RANGE);
      handlers.onDone?.();
      cleanup();
      emitDone();
    }
  });

  player.play();
  syncRangeToPlaybackTime(0);
  cancelCurrent = cancel;
  return cancel;
}
