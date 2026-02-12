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

const BATCH_SIZE = Number(process.env.STORY_AUTHOR_FIX_BATCH_SIZE ?? "200");
const START_ID = Number(process.env.STORY_AUTHOR_FIX_START_ID ?? "1");
const END_ID_RAW = process.env.STORY_AUTHOR_FIX_END_ID;
const END_ID = END_ID_RAW ? Number(END_ID_RAW) : undefined;
const DRY_RUN = process.env.STORY_AUTHOR_FIX_DRY_RUN === "true";

type UserColumnRow = { column_name: string };
type StoryAuthorRow = {
  story_id: number;
  author_legacy_id: number | string | null;
  author_change_legacy_id: number | string | null;
};

const PREFERRED_USER_LEGACY_COLUMNS = [
  "legacyId",
  "legacy_id",
  "user_id",
  "userId",
  "id",
] as const;

function toOptionalNumber(value: number | string | null): number | undefined {
  if (value === null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

async function detectLegacyUserColumn(): Promise<string> {
  const rows = await sql<UserColumnRow[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
  `;
  const existing = new Set(rows.map((row) => row.column_name));
  for (const candidate of PREFERRED_USER_LEGACY_COLUMNS) {
    if (existing.has(candidate)) return candidate;
  }
  throw new Error(
    `Could not find users legacy id column. Checked: ${PREFERRED_USER_LEGACY_COLUMNS.join(", ")}`,
  );
}

async function run() {
  const legacyUserColumn = await detectLegacyUserColumn();
  console.log(`Using users.${legacyUserColumn} as source legacy user id.`);

  let totalRead = 0;
  let totalPatched = 0;
  let totalMissing = 0;
  let lastId = START_ID - 1;

  for (;;) {
    const whereEnd = END_ID !== undefined ? `AND s.id <= ${END_ID}` : "";
    const rows = await sql.unsafe<StoryAuthorRow[]>(`
      SELECT
        s.id AS story_id,
        u_author.${legacyUserColumn} AS author_legacy_id,
        u_change.${legacyUserColumn} AS author_change_legacy_id
      FROM story s
      LEFT JOIN users u_author ON u_author.id = s.author
      LEFT JOIN users u_change ON u_change.id = s.author_change
      WHERE s.id > ${lastId}
        ${whereEnd}
      ORDER BY s.id
      LIMIT ${BATCH_SIZE}
    `);

    if (!rows.length) break;

    const payload = rows.map((row) => ({
      legacyStoryId: row.story_id,
      authorId: toOptionalNumber(row.author_legacy_id),
      authorChangeId: toOptionalNumber(row.author_change_legacy_id),
    }));

    totalRead += rows.length;
    lastId = rows[rows.length - 1].story_id;

    if (!DRY_RUN) {
      const result = (await client.mutation(
        api.storyTables.patchStoryAuthorsBatch,
        { rows: payload },
      )) as { updated: number; missingStories: number[] };
      totalPatched += result.updated;
      totalMissing += result.missingStories.length;
    }

    console.log(`Processed ${totalRead} rows (last story id=${lastId})`);
  }

  if (DRY_RUN) {
    console.log(`Dry run complete. Would process ${totalRead} rows.`);
  } else {
    console.log(
      `Done. Processed=${totalRead}, patched=${totalPatched}, missingStories=${totalMissing}`,
    );
  }
}

run()
  .catch((error) => {
    console.error("Story author id migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
