import postgres from "postgres";
import { track } from "@vercel/analytics";

const cyrb53 = (str, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

// will use psql environment variables
export const sql = postgres(process.env.POSTGRES_URL, {
  /* options */
  //debug: console.log,
  debug: (...args) => {
    track("query", { query: cyrb53(args[1]) });
  },
  ssl: "require",
});

import { unstable_cache } from "next/cache";
export const cache = (f, ...args) => {
  //console.log("cache", ...args);
  return unstable_cache(f, ...args);
};
