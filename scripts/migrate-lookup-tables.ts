import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
const POSTGRES_URL = process.env.POSTGRES_URL2 || process.env.POSTGRES_URL || process.env.DATABASE_URL;

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
  ssl: POSTGRES_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});
const client = new ConvexHttpClient(CONVEX_URL);

const BATCH_SIZE = Number(process.env.LOOKUP_MIGRATION_BATCH_SIZE ?? "200");

type LanguageRow = {
  id: number;
  name: string;
  short: string;
  flag: number | null;
  flag_file: string | null;
  speaker: string | null;
  default_text: string | null;
  tts_replace: string | null;
  public: boolean;
  rtl: boolean;
};

type ImageRow = {
  id: string;
  active: string;
  gilded: string;
  locked: string;
  active_lip: string;
  gilded_lip: string;
};

type AvatarRow = {
  id: number;
  link: string;
  name: string | null;
};

async function runBatch<T>(items: T[], fn: (chunk: T[]) => Promise<void>) {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    await fn(chunk);
    console.log(`Processed ${Math.min(i + BATCH_SIZE, items.length)}/${items.length}`);
  }
}

async function migrateLanguages() {
  console.log("Migrating language table...");
  const rows = await sql<LanguageRow[]>`
    SELECT id, name, short, flag, flag_file, speaker, default_text, tts_replace, public, rtl
    FROM language
    ORDER BY id
  `;

  await runBatch(rows, async (chunk) => {
    await client.mutation((anyApi as any).lookupTables.upsertLanguagesBatch, {
      languages: chunk,
    });
  });

  console.log(`Language done: ${rows.length}`);
}

async function migrateImages() {
  console.log("Migrating image table...");
  const rows = await sql<ImageRow[]>`
    SELECT id, active, gilded, locked, active_lip, gilded_lip
    FROM image
    ORDER BY id
  `;

  await runBatch(rows, async (chunk) => {
    await client.mutation((anyApi as any).lookupTables.upsertImagesBatch, {
      images: chunk,
    });
  });

  console.log(`Image done: ${rows.length}`);
}

async function migrateAvatars() {
  console.log("Migrating avatar table...");
  const rows = await sql<AvatarRow[]>`
    SELECT id, link, name
    FROM avatar
    ORDER BY id
  `;

  await runBatch(rows, async (chunk) => {
    await client.mutation((anyApi as any).lookupTables.upsertAvatarsBatch, {
      avatars: chunk,
    });
  });

  console.log(`Avatar done: ${rows.length}`);
}

async function main() {
  await migrateLanguages();
  await migrateImages();
  await migrateAvatars();
  console.log("Lookup table migration complete");
}

main()
  .catch((error) => {
    console.error("Lookup table migration failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
