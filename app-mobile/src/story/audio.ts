import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioInfo } from "./types";

const BLOB_BASE = "https://ptoqrnbx8ghuucmt.public.blob.vercel-storage.com";

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
 * Plays a line's audio, driving word highlighting through keypoint timeouts
 * (same algorithm as the web's use-audio hook). Returns a cancel function.
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

  const player = createAudioPlayer({ uri: url });
  const timeouts: ReturnType<typeof setTimeout>[] = [];
  let finished = false;
  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    timeouts.forEach(clearTimeout);
    subscription.remove();
    try {
      player.release();
    } catch {}
    if (cancelCurrent === cancel) cancelCurrent = null;
  };

  const cancel = (resetRange = true) => {
    if (resetRange) handlers.onRange?.(99999);
    try {
      player.pause();
    } catch {}
    cleanup();
  };

  const subscription = player.addListener("playbackStatusUpdate", (status) => {
    if (status.didJustFinish && !finished) {
      finished = true;
      handlers.onRange?.(99999);
      handlers.onDone?.();
      cleanup();
      emitDone();
    }
  });

  audio?.keypoints?.forEach((keypoint) => {
    timeouts.push(
      setTimeout(() => handlers.onRange?.(keypoint.rangeEnd), keypoint.audioStart),
    );
  });

  player.play();
  cancelCurrent = cancel;
  return cancel;
}
