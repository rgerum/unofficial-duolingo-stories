import { createAudioPlayer } from "expo-audio";

// Same effects as the web's src/lib/sound-effects.ts (files copied from
// public/). Effects play on their own player so they mix with line audio
// instead of interrupting it.
const SOURCES = {
  right: require("../../assets/sounds/sound_right.mp3"),
  wrong: require("../../assets/sounds/sound_wrong.mp3"),
  done: require("../../assets/sounds/sound_done.mp3"),
} as const;

// Calibrated from ffmpeg loudnorm against sampled story voice lines
// (voice average about -19.6 LUFS).
const VOLUMES = {
  right: 0.67,
  wrong: 0.86,
  done: 0.52,
} as const satisfies Record<keyof typeof SOURCES, number>;

export type SoundEffectName = keyof typeof SOURCES;

export function playSoundEffect(name: SoundEffectName): void {
  try {
    const player = createAudioPlayer(SOURCES[name]);
    player.volume = VOLUMES[name];
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
