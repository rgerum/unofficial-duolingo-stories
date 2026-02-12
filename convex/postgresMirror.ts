"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import postgres from "postgres";

let sqlClient: ReturnType<typeof postgres> | null = null;

function getSqlClient() {
  if (sqlClient) return sqlClient;

  const url = process.env.POSTGRES_URL2;
  if (!url) {
    throw new Error("POSTGRES_URL2 is not configured in Convex environment");
  }

  sqlClient = postgres(url, {
    max: 1,
    prepare: false,
    ssl: "require",
  });
  return sqlClient;
}

export const mirrorLanguageDefaultText = internalAction({
  args: {
    legacyLanguageId: v.number(),
    default_text: v.string(),
    operationKey: v.string(),
  },
  returns: v.object({
    updated: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    const rows =
      await sql`UPDATE language SET default_text = ${args.default_text} WHERE id = ${args.legacyLanguageId} RETURNING id`;
    return { updated: rows.length > 0 };
  },
});

export const mirrorLanguageTtsReplace = internalAction({
  args: {
    legacyLanguageId: v.number(),
    tts_replace: v.string(),
    operationKey: v.string(),
  },
  returns: v.object({
    updated: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    const rows =
      await sql`UPDATE language SET tts_replace = ${args.tts_replace} WHERE id = ${args.legacyLanguageId} RETURNING id`;
    return { updated: rows.length > 0 };
  },
});

export const mirrorLocalizationUpsert = internalAction({
  args: {
    legacyLanguageId: v.number(),
    tag: v.string(),
    text: v.string(),
    operationKey: v.string(),
  },
  returns: v.object({
    id: v.union(v.number(), v.null()),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    const rows =
      await sql`INSERT INTO localization (tag, text, language_id)
      VALUES (${args.tag}, ${args.text}, ${args.legacyLanguageId})
      ON CONFLICT (tag, language_id)
      DO UPDATE SET text = EXCLUDED.text
      RETURNING id`;
    return { id: typeof rows[0]?.id === "number" ? rows[0].id : null };
  },
});

export const mirrorAvatarMappingUpsert = internalAction({
  args: {
    legacyLanguageId: v.number(),
    legacyAvatarId: v.number(),
    name: v.string(),
    speaker: v.string(),
    operationKey: v.string(),
  },
  returns: v.object({
    id: v.union(v.number(), v.null()),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    const existing =
      await sql`SELECT id FROM avatar_mapping WHERE language_id = ${args.legacyLanguageId} AND avatar_id = ${args.legacyAvatarId} LIMIT 1`;

    if (existing.length) {
      const id = existing[0].id as number;
      const updated =
        await sql`UPDATE avatar_mapping SET name = ${args.name}, speaker = ${args.speaker}, language_id = ${args.legacyLanguageId}, avatar_id = ${args.legacyAvatarId} WHERE id = ${id} RETURNING id`;
      return { id: typeof updated[0]?.id === "number" ? updated[0].id : id };
    }

    const inserted =
      await sql`INSERT INTO avatar_mapping (name, speaker, language_id, avatar_id) VALUES (${args.name}, ${args.speaker}, ${args.legacyLanguageId}, ${args.legacyAvatarId}) RETURNING id`;
    return { id: typeof inserted[0]?.id === "number" ? inserted[0].id : null };
  },
});

export const mirrorStorySet = internalAction({
  args: {
    storyId: v.number(),
    duo_id: v.string(),
    name: v.string(),
    image: v.string(),
    change_date: v.string(),
    author_change: v.number(),
    set_id: v.number(),
    set_index: v.number(),
    course_id: v.number(),
    text: v.string(),
    json: v.any(),
    todo_count: v.number(),
    operationKey: v.string(),
  },
  returns: v.object({
    updated: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    const updated =
      await sql`UPDATE story SET duo_id = ${args.duo_id}, name = ${args.name}, image = ${args.image}, change_date = ${args.change_date}, author_change = ${args.author_change}, set_id = ${args.set_id}, set_index = ${args.set_index}, course_id = ${args.course_id}, text = ${args.text}, json = ${args.json}, todo_count = ${args.todo_count} WHERE id = ${args.storyId} RETURNING id`;

    await sql`UPDATE course SET todo_count = (SELECT SUM(todo_count) FROM story WHERE course_id = ${args.course_id}) WHERE id = ${args.course_id}`;
    return { updated: updated.length > 0 };
  },
});

export const mirrorStoryDelete = internalAction({
  args: {
    storyId: v.number(),
    operationKey: v.string(),
  },
  returns: v.object({
    updated: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    const rows =
      await sql`UPDATE story SET deleted = true, public = false WHERE id = ${args.storyId} RETURNING id`;
    return { updated: rows.length > 0 };
  },
});
