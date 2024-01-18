import postgres from "postgres";

// will use psql environment variables
export const sql = postgres(process.env.POSTGRES_URL, {
  /* options */
  debug: console.log,
  ssl: "require",
});

import { unstable_cache } from "next/cache";
export const cache = (f, ...args) => {
  console.log("cache", ...args);
  return unstable_cache(f, ...args);
};
