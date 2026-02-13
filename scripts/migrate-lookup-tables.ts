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

type SpeakerRow = {
  id: number;
  language_id: number;
  speaker: string;
  gender: string;
  type: string;
  service: string;
};

type LocalizationRow = {
  id: number;
  language_id: number;
  tag: string;
  text: string;
};

type CourseRow = {
  id: number;
  short: string | null;
  learning_language: number | null;
  from_language: number | null;
  public: boolean;
  official: boolean;
  name: string | null;
  about: string | null;
  conlang: boolean | null;
  tags: string[] | null;
  count: number | null;
  learning_language_name: string | null;
  from_language_name: string | null;
  contributors: string[] | null;
  contributors_past: string[] | null;
  todo_count: number | null;
};

type AvatarMappingRow = {
  id: number;
  avatar_id: number;
  language_id: number;
  name: string | null;
  speaker: string | null;
};

function optionalString(value: string | null): string | undefined {
  return value ?? undefined;
}

function optionalNumber(value: number | null): number | undefined {
  return value ?? undefined;
}

async function runBatch<T>(items: T[], fn: (chunk: T[]) => Promise<void>) {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    await fn(chunk);
    console.log(
      `Processed ${Math.min(i + BATCH_SIZE, items.length)}/${items.length}`,
    );
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
    for (const row of chunk) {
      await client.mutation(api.lookupTables.upsertLanguage, {
        language: {
          legacyId: row.id,
          name: row.name,
          short: row.short,
          flag: optionalNumber(row.flag),
          flag_file: optionalString(row.flag_file),
          speaker: optionalString(row.speaker),
          default_text: optionalString(row.default_text),
          tts_replace: optionalString(row.tts_replace),
          public: row.public,
          rtl: row.rtl,
        },
      });
    }
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
    for (const row of chunk) {
      await client.mutation(api.lookupTables.upsertImage, {
        image: {
          legacyId: row.id,
          active: row.active,
          gilded: row.gilded,
          locked: row.locked,
          active_lip: row.active_lip,
          gilded_lip: row.gilded_lip,
        },
      });
    }
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
    for (const row of chunk) {
      await client.mutation(api.lookupTables.upsertAvatar, {
        avatar: {
          legacyId: row.id,
          link: row.link,
          name: optionalString(row.name),
        },
      });
    }
  });

  console.log(`Avatar done: ${rows.length}`);
}

async function migrateSpeakers() {
  console.log("Migrating speaker table...");
  const rows = await sql<SpeakerRow[]>`
    SELECT id, language_id, speaker, gender, type, service
    FROM speaker
    ORDER BY id
  `;

  await runBatch(rows, async (chunk) => {
    const speakers = chunk.map((row) => ({
      legacyId: row.id,
      legacyLanguageId: row.language_id,
      speaker: row.speaker,
      gender: row.gender,
      type: row.type,
      service: row.service,
    }));
    for (const speaker of speakers) {
      await client.mutation(api.lookupTables.upsertSpeaker, { speaker });
    }
  });

  console.log(`Speaker done: ${rows.length}`);
}

async function migrateLocalizations() {
  console.log("Migrating localization table...");
  const rows = await sql<LocalizationRow[]>`
    SELECT id, language_id, tag, text
    FROM localization
    ORDER BY id
  `;

  await runBatch(rows, async (chunk) => {
    for (const row of chunk) {
      await client.mutation(api.lookupTables.upsertLocalization, {
        localization: {
          legacyId: row.id,
          legacyLanguageId: row.language_id,
          tag: row.tag,
          text: row.text,
        },
      });
    }
  });

  console.log(`Localization done: ${rows.length}`);
}

async function migrateCourses() {
  console.log("Migrating course table...");
  const rows = await sql<CourseRow[]>`
    SELECT id, short, learning_language, from_language, public, official, name, about, conlang, tags, count, learning_language_name, from_language_name, contributors, contributors_past, todo_count
    FROM course
    ORDER BY id
  `;

  await runBatch(rows, async (chunk) => {
    for (const row of chunk) {
      if (
        typeof row.learning_language !== "number" ||
        typeof row.from_language !== "number"
      ) {
        throw new Error(
          `Course ${row.id} missing language references (learning_language/from_language)`,
        );
      }

      await client.mutation(api.lookupTables.upsertCourse, {
        course: {
          legacyId: row.id,
          short: optionalString(row.short),
          legacyLearningLanguageId: row.learning_language,
          legacyFromLanguageId: row.from_language,
          public: row.public,
          official: row.official,
          name: optionalString(row.name),
          about: optionalString(row.about),
          conlang: row.conlang ?? undefined,
          tags: row.tags ?? undefined,
          count: optionalNumber(row.count),
          learning_language_name: optionalString(row.learning_language_name),
          from_language_name: optionalString(row.from_language_name),
          contributors: row.contributors ?? undefined,
          contributors_past: row.contributors_past ?? undefined,
          todo_count: optionalNumber(row.todo_count),
        },
      });
    }
  });

  console.log(`Course done: ${rows.length}`);
}

async function migrateAvatarMappings() {
  console.log("Migrating avatar_mapping table...");
  const rows = await sql<AvatarMappingRow[]>`
    SELECT id, avatar_id, language_id, name, speaker
    FROM avatar_mapping
    ORDER BY id
  `;

  await runBatch(rows, async (chunk) => {
    for (const row of chunk) {
      try {
        await client.mutation(api.lookupTables.upsertAvatarMapping, {
          avatarMapping: {
            legacyId: row.id,
            legacyAvatarId: row.avatar_id,
            legacyLanguageId: row.language_id,
            name: optionalString(row.name),
            speaker: optionalString(row.speaker),
          },
        });
      } catch (error) {
        throw new Error(
          `avatar_mapping migration failed at row id=${row.id} avatar_id=${row.avatar_id} language_id=${row.language_id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  });

  console.log(`Avatar mapping done: ${rows.length}`);
}

async function main() {
  const only = process.env.LOOKUP_MIGRATION_ONLY;
  if (only === "language") return void (await migrateLanguages());
  if (only === "image") return void (await migrateImages());
  if (only === "avatar") return void (await migrateAvatars());
  if (only === "speaker") return void (await migrateSpeakers());
  if (only === "localization") return void (await migrateLocalizations());
  if (only === "course") return void (await migrateCourses());
  if (only === "avatar_mapping") return void (await migrateAvatarMappings());

  await migrateLanguages();
  await migrateImages();
  await migrateAvatars();
  await migrateSpeakers();
  await migrateLocalizations();
  await migrateCourses();
  await migrateAvatarMappings();
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
