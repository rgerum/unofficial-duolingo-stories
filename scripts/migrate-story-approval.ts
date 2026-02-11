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

const BATCH_SIZE = Number(
  process.env.STORY_APPROVAL_MIGRATION_BATCH_SIZE ?? "500",
);
const CONVEX_BATCH_SIZE = Number(
  process.env.STORY_APPROVAL_CONVEX_BATCH_SIZE ?? "200",
);
const START_ID = Number(process.env.STORY_APPROVAL_MIGRATION_START_ID ?? "1");
const END_ID_RAW = process.env.STORY_APPROVAL_MIGRATION_END_ID;
const END_ID = END_ID_RAW ? Number(END_ID_RAW) : undefined;

type StoryApprovalRow = {
  id: number;
  story_id: number;
  user_id: number;
  date: string | Date | null;
};

function toTimestampMs(value: string | Date | null): number | undefined {
  if (value === null) return undefined;
  const ts = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(ts) ? ts : undefined;
}

async function migrateStoryApproval() {
  console.log(
    `Migrating story_approval. sqlBatchSize=${BATCH_SIZE} convexBatchSize=${CONVEX_BATCH_SIZE}`,
  );
  let total = 0;
  let lastId = START_ID - 1;
  let failed = 0;

  const retryDelaysMs = [100, 300, 800] as const;

  async function upsertWithRetry(row: StoryApprovalRow) {
    let lastError: unknown;
    for (const delay of retryDelaysMs) {
      try {
        await client.mutation(api.storyApproval.upsertStoryApproval, {
          legacyStoryId: row.story_id,
          legacyUserId: row.user_id,
          date: toTimestampMs(row.date),
          legacyApprovalId: row.id,
        });
        return;
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  async function upsertBatchWithRetry(rows: StoryApprovalRow[]) {
    let lastError: unknown;
    for (const delay of retryDelaysMs) {
      try {
        return await client.mutation(api.storyApproval.upsertStoryApprovalBatch, {
          rows: rows.map((row) => ({
            legacyStoryId: row.story_id,
            legacyUserId: row.user_id,
            date: toTimestampMs(row.date),
            legacyApprovalId: row.id,
          })),
        });
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  for (;;) {
    const rows = await sql<StoryApprovalRow[]>`
      SELECT id, story_id, user_id, date
      FROM story_approval
      WHERE id > ${lastId}
      ${END_ID !== undefined ? sql`AND id <= ${END_ID}` : sql``}
      ORDER BY id
      LIMIT ${BATCH_SIZE}
    `;
    if (!rows.length) break;

    for (let i = 0; i < rows.length; i += CONVEX_BATCH_SIZE) {
      const slice = rows.slice(i, i + CONVEX_BATCH_SIZE);
      try {
        const result = await upsertBatchWithRetry(slice);
        if (result.missingStories.length > 0) {
          console.warn(
            `story_approval batch missing parent stories: count=${result.missingStories.length} sample=${result.missingStories.slice(0, 5).join(",")}`,
          );
        }
      } catch (batchError) {
        console.error(
          `story_approval batch failed (size=${slice.length}); falling back to row-by-row: ${batchError instanceof Error ? batchError.message : String(batchError)}`,
        );
        for (const row of slice) {
          try {
            await upsertWithRetry(row);
          } catch (rowError) {
            failed += 1;
            console.error(
              `story_approval row failed id=${row.id} story_id=${row.story_id} user_id=${row.user_id}: ${rowError instanceof Error ? rowError.message : String(rowError)}`,
            );
          }
        }
      }
    }

    total += rows.length;
    lastId = rows[rows.length - 1].id;
    console.log(
      `Processed ${total} rows so far (last id=${lastId}, failed=${failed})...`,
    );
  }

  console.log(`Story_approval migration complete: ${total} rows`);
  if (failed > 0) {
    throw new Error(
      `Story_approval migration completed with ${failed} failed rows`,
    );
  }
}

migrateStoryApproval()
  .catch((error) => {
    console.error("Story_approval migration failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
