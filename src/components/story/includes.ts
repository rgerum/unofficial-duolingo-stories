/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
let random_seed = 1234;
Math.set_seed = function (seed) {
  random_seed = seed;
};
Math.random_seeded = function () {
  random_seed = Math.sin(random_seed) * 10000;
  return random_seed - Math.floor(random_seed);
};

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random_seeded() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
