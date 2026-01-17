/**
 * Shuffles array in place. ES6 version
 */

// Extend Math interface for seeded random
declare global {
  interface Math {
    set_seed: (seed: number) => void;
    random_seeded: () => number;
  }
}

let random_seed = 1234;
Math.set_seed = function (seed: number) {
  random_seed = seed;
};
Math.random_seeded = function () {
  random_seed = Math.sin(random_seed) * 10000;
  return random_seed - Math.floor(random_seed);
};

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random_seeded() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
