import postgres from "postgres";

// will use psql environment variables
export const sql = postgres(process.env.POSTGRES_URL2, {
  /* options */
  //debug: console.log,
  ssl:
    process.env?.POSTGRES_URL2.indexOf("localhost") !== -1 ? false : "require",
});

import { unstable_cache } from "next/cache";
export const cache = (f, ...args) => {
  //console.log("cache", ...args);
  if (process.env.NO_CACHE === "true") return f;
  return unstable_cache(f, ...args);
};
