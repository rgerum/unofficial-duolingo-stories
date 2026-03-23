const SOUND_EFFECT_URLS = {
  done: "/sound_done.mp3",
  right: "/sound_right.mp3",
  wrong: "/sound_wrong.mp3",
} as const;

type SoundEffectName = keyof typeof SOUND_EFFECT_URLS;

const audioCache = new Map<SoundEffectName, HTMLAudioElement>();

export function playSoundEffect(name: SoundEffectName) {
  if (typeof window === "undefined") return;

  let audio = audioCache.get(name);
  if (!audio) {
    audio = new Audio(SOUND_EFFECT_URLS[name]);
    audio.preload = "auto";
    audioCache.set(name, audio);
  }

  audio.currentTime = 0;
  void audio.play().catch(() => {});
}
