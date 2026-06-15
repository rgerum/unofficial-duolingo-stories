import { createAudioPlayer } from "expo-audio";

// Same effects as the web's src/lib/sound-effects.ts (files copied from
// public/). Effects play on their own player so they mix with line audio
// instead of interrupting it.
const SOURCES = {
  right: require("../../assets/sounds/sound_right.mp3"),
  wrong: require("../../assets/sounds/sound_wrong.mp3"),
  done: require("../../assets/sounds/sound_done.mp3"),
} as const;

export type SoundEffectName = keyof typeof SOURCES;

export function playSoundEffect(name: SoundEffectName): void {
  try {
    const player = createAudioPlayer(SOURCES[name]);
    const subscription = player.addListener(
      "playbackStatusUpdate",
      (status) => {
        if (status.didJustFinish) {
          subscription.remove();
          try {
            player.release();
          } catch {}
        }
      },
    );
    player.play();
  } catch {
    // sound effects are best-effort
  }
}
