import postgres from "postgres";
import { track } from "@vercel/analytics/server";

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
    if (process.env.LOG_QUERY === "true") {
      const hash = `${cyrb53(args[1])}`;
      if (!hash_table[hash]) {
        hash_table[hash] = args[1];
        fs.writeFileSync(
          "hash_table.json",
          JSON.stringify(hash_table, null, 2),
        );
      }
      console.log("query", { query: hash, sql: args[1] });
    } else {
      if (!process.env.NO_TRACK_QUERY)
        track("query", { query: cyrb53(args[1]) });
    }
  },
  ssl: "require",
});

const hash_table =
  process.env.LOG_QUERY === "true"
    ? JSON.parse(fs.readFileSync("hash_table.json", "utf8"))
    : {};

import { unstable_cache } from "next/cache";
import fs from "fs";
export const cache = (f, ...args) => {
  //console.log("cache", ...args);
  if (process.env.NO_CACHE === "true") return f;
  return unstable_cache(f, ...args);
};
