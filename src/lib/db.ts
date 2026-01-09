import postgres from "postgres";

if (!process.env.POSTGRES_URL2) throw new Error("Missing POSTGRES_URL");

// will use psql environment variables
export const sql = postgres(process.env.POSTGRES_URL2, {
  /* options */
  //debug: console.log,
  ssl:
    process.env?.POSTGRES_URL2.indexOf("localhost") !== -1 ? false : "require",
});

type Callback = (...args: any[]) => Promise<any>;
import { unstable_cache } from "next/cache";
export function cache<T extends Callback>(
  cb: T,
  keyParts?: string[],
  options?: { revalidate?: number | false; tags?: string[] },
): T {
  //console.log("cache", ...args);
  if (process.env.NO_CACHE === "true") return cb;
  return unstable_cache(cb, keyParts, options);
}
