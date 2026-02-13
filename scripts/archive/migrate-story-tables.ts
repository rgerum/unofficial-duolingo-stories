import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

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

const BATCH_SIZE = Number(process.env.STORY_MIGRATION_BATCH_SIZE ?? "100");
const START_ID = Number(process.env.STORY_MIGRATION_START_ID ?? "1");
const END_ID_RAW = process.env.STORY_MIGRATION_END_ID;
const END_ID = END_ID_RAW ? Number(END_ID_RAW) : undefined;

type StoryRow = {
  id: number;
  duo_id: string | null;
  name: string | null;
  set_id: number | null;
  set_index: number | null;
  author: number | null;
  author_change: number | null;
  date: string | Date | null;
  change_date: string | Date | null;
  date_published: string | Date | null;
  text: string | null;
  public: boolean | null;
  image: string | null;
  course_id: number | null;
  json: unknown;
  status: "draft" | "feedback" | "finished" | null;
  deleted: boolean | null;
  todo_count: number | null;
};

type StoryContentRow = {
  id: number;
  duo_id: string | null;
  name: string | null;
  set_id: number | null;
  set_index: number | null;
  author: number | null;
  author_change: number | null;
  date_published: string | Date | null;
  public: boolean | null;
  image: string | null;
  course_id: number | null;
  status: "draft" | "feedback" | "finished" | null;
  deleted: boolean | null;
  todo_count: number | null;
  text: string | null;
  json: unknown;
  change_date: string | Date | null;
  date: string | Date | null;
};

function optionalString(value: string | null): string | undefined {
  return value ?? undefined;
}

function optionalNumber(value: number | null): number | undefined {
  return value ?? undefined;
}

function toTimestampMs(value: string | Date | null): number | undefined {
  if (value === null) return undefined;
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function parseJsonLike(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    const parsed = JSON.parse(value);
    // Some legacy rows were stored double-encoded (JSON string of JSON string).
    if (typeof parsed === "string") {
      try {
        return JSON.parse(parsed);
      } catch {
        return parsed;
      }
    }
    return parsed;
  } catch {
    return value;
  }
}

function mapStoryMutation(row: StoryRow | StoryContentRow) {
  return {
    legacyId: row.id,
    duo_id: optionalString(row.duo_id),
    name: row.name ?? "",
    set_id: optionalNumber(row.set_id),
    set_index: optionalNumber(row.set_index),
    authorId: optionalNumber(row.author),
    authorChangeId: optionalNumber(row.author_change),
    date: toTimestampMs(row.date),
    change_date: toTimestampMs(row.change_date),
    date_published: toTimestampMs(row.date_published),
    public: row.public ?? false,
    legacyImageId: optionalString(row.image),
    legacyCourseId: row.course_id as number,
    status: row.status ?? "draft",
    deleted: row.deleted ?? false,
    todo_count: row.todo_count ?? 0,
  };
}

async function upsertStoryRow(row: StoryRow | StoryContentRow) {
  if (typeof row.course_id !== "number") {
    throw new Error(`story id=${row.id} missing course_id`);
  }
  await client.mutation(api.storyTables.upsertStory, {
    story: mapStoryMutation(row),
  });
}

async function migrateStories() {
  console.log("Migrating story metadata -> stories...");
  let total = 0;
  let lastId = START_ID - 1;
  for (;;) {
    const rows = await sql<StoryRow[]>`
      SELECT id, duo_id, name, set_id, set_index, author, author_change, date, change_date, date_published, text, public, image, course_id, json, status, deleted, todo_count
      FROM story
      WHERE id > ${lastId}
      ${END_ID !== undefined ? sql`AND id <= ${END_ID}` : sql``}
      ORDER BY id
      LIMIT ${BATCH_SIZE}
    `;
    if (!rows.length) break;
    for (const row of rows) {
      await upsertStoryRow(row);
    }
    total += rows.length;
    lastId = rows[rows.length - 1].id;
    console.log(`Processed ${total} rows so far (last id=${lastId})...`);
  }
  console.log(`Story metadata migration complete: ${total} rows`);
}

async function migrateStoryContent() {
  console.log("Migrating story payload -> story_content...");
  let total = 0;
  let lastId = START_ID - 1;
  for (;;) {
    const rows = await sql<StoryContentRow[]>`
      SELECT id, duo_id, name, set_id, set_index, author, author_change, date_published, public, image, course_id, status, deleted, todo_count, text, json, change_date, date
      FROM story
      WHERE id > ${lastId}
      ${END_ID !== undefined ? sql`AND id <= ${END_ID}` : sql``}
      ORDER BY id
      LIMIT ${BATCH_SIZE}
    `;
    if (!rows.length) break;
    for (const row of rows) {
      // Ensure parent story exists before content write to avoid expected
      // "Missing story" errors when running content-only backfills.
      await upsertStoryRow(row);

      const parsedJson = parseJsonLike(row.json);
      if (parsedJson === undefined || parsedJson === null) continue;
      try {
        await client.mutation(api.storyTables.upsertStoryContent, {
          storyContent: {
            legacyStoryId: row.id,
            text: row.text ?? "",
            json: parsedJson,
            lastUpdated:
            toTimestampMs(row.change_date) ?? toTimestampMs(row.date) ?? Date.now(),
          },
        });
      } catch (error) {
        // Be resilient to any content write failure by ensuring parent story exists
        // and then retrying once.
        const firstError = error instanceof Error ? error.message : String(error);
        console.warn(
          `upsertStoryContent failed for story ${row.id}; attempting metadata repair + retry: ${firstError}`,
        );
        await upsertStoryRow(row);
        try {
          await client.mutation(api.storyTables.upsertStoryContent, {
            storyContent: {
              legacyStoryId: row.id,
              text: row.text ?? "",
              json: parsedJson,
              lastUpdated:
                toTimestampMs(row.change_date) ?? toTimestampMs(row.date) ?? Date.now(),
            },
          });
        } catch (retryError) {
          const retryMessage =
            retryError instanceof Error ? retryError.message : String(retryError);
          throw new Error(
            `story_content upsert failed for legacy story ${row.id} after metadata repair. first=${firstError} retry=${retryMessage}`,
          );
        }
      }
    }
    total += rows.length;
    lastId = rows[rows.length - 1].id;
    console.log(`Processed ${total} rows so far (last id=${lastId})...`);
  }
  console.log(`Story content migration complete: ${total} rows`);
}

async function main() {
  const only = process.env.STORY_MIGRATION_ONLY;
  if (only === "stories") return void (await migrateStories());
  if (only === "story_content") return void (await migrateStoryContent());

  await migrateStories();
  await migrateStoryContent();
  console.log("Story table migration complete");
}

main()
  .catch((error) => {
    console.error("Story table migration failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
