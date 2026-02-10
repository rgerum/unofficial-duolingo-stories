import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
const POSTGRES_URL =
  process.env.POSTGRES_URL2 ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (!CONVEX_URL) {
  console.error("Error: CONVEX_URL is not set");
  process.exit(1);
}
if (!POSTGRES_URL) {
  console.error("Error: POSTGRES_URL2/POSTGRES_URL/DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(POSTGRES_URL, {
  max: 5,
  ssl: POSTGRES_URL.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});
const client = new ConvexHttpClient(CONVEX_URL);

const BATCH_SIZE = Number(process.env.STORY_DONE_MIGRATION_BATCH_SIZE ?? "500");
const START_ID = Number(process.env.STORY_DONE_MIGRATION_START_ID ?? "1");
const END_ID_RAW = process.env.STORY_DONE_MIGRATION_END_ID;
const END_ID = END_ID_RAW ? Number(END_ID_RAW) : undefined;

type StoryDoneRow = {
  id: number;
  story_id: number;
  user_id: number | null;
  time: string | Date | null;
};

function toTimestampMs(value: string | Date | null): number | undefined {
  if (value === null) return undefined;
  const ts = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(ts) ? ts : undefined;
}

async function migrateStoryDone() {
  console.log("Migrating story_done...");
  let total = 0;
  let lastId = START_ID - 1;

  for (;;) {
    const rows = await sql<StoryDoneRow[]>`
      SELECT id, story_id, user_id, time
      FROM story_done
      WHERE id > ${lastId}
      ${END_ID !== undefined ? sql`AND id <= ${END_ID}` : sql``}
      ORDER BY id
      LIMIT ${BATCH_SIZE}
    `;
    if (!rows.length) break;

    for (const row of rows) {
      await client.mutation((api as any).storyDone.recordStoryDone, {
        legacyStoryId: row.story_id,
        legacyUserId: row.user_id ?? undefined,
        time: toTimestampMs(row.time),
      });
    }

    total += rows.length;
    lastId = rows[rows.length - 1].id;
    console.log(`Processed ${total} rows so far (last id=${lastId})...`);
  }

  console.log(`Story_done migration complete: ${total} rows`);
}

migrateStoryDone()
  .catch((error) => {
    console.error("Story_done migration failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
