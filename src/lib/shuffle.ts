/**
 * Shuffles array in place using seeded random for deterministic results
 */

let random_seed = 1234;

function setSeed(seed: number) {
  random_seed = seed;
}

function randomSeeded() {
  random_seed = Math.sin(random_seed) * 10000;
  return random_seed - Math.floor(random_seed);
}

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(randomSeeded() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
