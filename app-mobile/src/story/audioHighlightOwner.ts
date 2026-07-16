export type AudioHighlightOwner = symbol | null;
type AudioHighlightOwnerListener = (owner: AudioHighlightOwner) => void;

let currentOwner: AudioHighlightOwner = null;
const listeners = new Set<AudioHighlightOwnerListener>();

export function claimAudioHighlight(owner: symbol): void {
  setAudioHighlightOwner(owner);
}

export function releaseAudioHighlight(owner: symbol): void {
  if (currentOwner === owner) setAudioHighlightOwner(null);
}

export function ownsAudioHighlight(owner: symbol): boolean {
  return currentOwner === owner;
}

export function subscribeToAudioHighlightOwner(
  listener: AudioHighlightOwnerListener,
): () => void {
  listeners.add(listener);
  listener(currentOwner);
  return () => {
    listeners.delete(listener);
  };
}

function setAudioHighlightOwner(owner: AudioHighlightOwner): void {
  if (currentOwner === owner) return;
  currentOwner = owner;
  for (const listener of [...listeners]) listener(owner);
}
