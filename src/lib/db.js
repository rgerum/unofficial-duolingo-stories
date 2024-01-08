import postgres from "postgres";

// will use psql environment variables
export const sql = postgres(
  process.env.POSTGRES_URL,
  process.env.POSTGRES_URL.endsWith("verceldb")
    ? {
        /* options */
        //debug: console.log,
        ssl: "require",
      }
    : {},
);
