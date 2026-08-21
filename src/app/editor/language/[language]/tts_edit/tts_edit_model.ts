const PITCH_VALUES = ["x-low", "low", "medium", "high", "x-high"] as const;
const SPEED_VALUES = ["x-slow", "slow", "medium", "fast", "x-fast"] as const;

export function formatTestVoice(voice: string, pitch: number, speed: number) {
  const modifiers: string[] = [];
  const pitchValue = PITCH_VALUES[pitch];
  const speedValue = SPEED_VALUES[speed];
  if (pitch !== 2 && pitchValue) modifiers.push(`pitch=${pitchValue}`);
  if (speed !== 2 && speedValue) modifiers.push(`rate=${speedValue}`);

  return modifiers.length > 0 ? `${voice}(${modifiers.join(", ")})` : voice;
}
