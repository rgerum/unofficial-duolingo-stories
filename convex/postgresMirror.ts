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

export const mirrorAdminLanguageUpdate = internalAction({
  args: {
    id: v.number(),
    name: v.string(),
    short: v.string(),
    flag: v.number(),
    flag_file: v.string(),
    speaker: v.string(),
    rtl: v.boolean(),
    operationKey: v.string(),
  },
  returns: v.object({
    updated: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    const rows =
      await sql`UPDATE language SET name = ${args.name}, short = ${args.short}, flag = ${args.flag}, flag_file = ${args.flag_file}, speaker = ${args.speaker}, rtl = ${args.rtl} WHERE id = ${args.id} RETURNING id`;
    return { updated: rows.length > 0 };
  },
});

export const mirrorAdminCourseUpdate = internalAction({
  args: {
    id: v.number(),
    learning_language: v.number(),
    learning_language_name: v.string(),
    from_language: v.number(),
    from_language_name: v.string(),
    short: v.string(),
    public: v.boolean(),
    name: v.union(v.string(), v.null()),
    conlang: v.boolean(),
    tags: v.array(v.string()),
    about: v.union(v.string(), v.null()),
    operationKey: v.string(),
  },
  returns: v.object({
    updated: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    const rows =
      await sql`UPDATE course SET learning_language = ${args.learning_language}, learning_language_name = ${args.learning_language_name}, from_language = ${args.from_language}, from_language_name = ${args.from_language_name}, public = ${args.public}, name = ${args.name}, conlang = ${args.conlang}, tags = ${args.tags}, short = ${args.short}, about = ${args.about} WHERE id = ${args.id} RETURNING id`;
    return { updated: rows.length > 0 };
  },
});

export const mirrorSpeakerUpsert = internalAction({
  args: {
    legacyLanguageId: v.number(),
    speaker: v.string(),
    gender: v.string(),
    type: v.string(),
    service: v.string(),
    operationKey: v.string(),
  },
  returns: v.object({
    updated: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    const existing =
      await sql`SELECT id FROM speaker WHERE speaker = ${args.speaker} LIMIT 1`;
    if (existing.length) {
      const rows =
        await sql`UPDATE speaker SET language_id = ${args.legacyLanguageId}, speaker = ${args.speaker}, gender = ${args.gender}, type = ${args.type}, service = ${args.service} WHERE id = ${existing[0].id} RETURNING id`;
      return { updated: rows.length > 0 };
    }
    const inserted =
      await sql`INSERT INTO speaker (language_id, speaker, gender, type, service) VALUES (${args.legacyLanguageId}, ${args.speaker}, ${args.gender}, ${args.type}, ${args.service}) RETURNING id`;
    return { updated: inserted.length > 0 };
  },
});

export const mirrorAdminLanguageInsert = internalAction({
  args: {
    id: v.number(),
    name: v.string(),
    short: v.string(),
    flag: v.number(),
    flag_file: v.string(),
    speaker: v.string(),
    default_text: v.string(),
    tts_replace: v.string(),
    public: v.boolean(),
    rtl: v.boolean(),
    operationKey: v.string(),
  },
  returns: v.object({
    inserted: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    await sql`INSERT INTO language (id, name, short, flag, flag_file, speaker, default_text, tts_replace, public, rtl)
      VALUES (${args.id}, ${args.name}, ${args.short}, ${args.flag}, ${args.flag_file}, ${args.speaker}, ${args.default_text}, ${args.tts_replace}, ${args.public}, ${args.rtl})`;
    await sql`SELECT setval(pg_get_serial_sequence('language', 'id'), (SELECT COALESCE(MAX(id), 1) FROM language))`;
    return { inserted: true };
  },
});

export const mirrorAdminCourseInsert = internalAction({
  args: {
    id: v.number(),
    learning_language: v.number(),
    learning_language_name: v.string(),
    from_language: v.number(),
    from_language_name: v.string(),
    short: v.string(),
    public: v.boolean(),
    official: v.number(),
    name: v.union(v.string(), v.null()),
    conlang: v.boolean(),
    tags: v.array(v.string()),
    about: v.union(v.string(), v.null()),
    operationKey: v.string(),
  },
  returns: v.object({
    inserted: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    await sql`INSERT INTO course (id, learning_language, learning_language_name, from_language, from_language_name, public, official, name, conlang, tags, short, about)
      VALUES (${args.id}, ${args.learning_language}, ${args.learning_language_name}, ${args.from_language}, ${args.from_language_name}, ${args.public}, ${args.official}, ${args.name}, ${args.conlang}, ${args.tags}, ${args.short}, ${args.about})`;
    await sql`SELECT setval(pg_get_serial_sequence('course', 'id'), (SELECT COALESCE(MAX(id), 1) FROM course))`;
    return { inserted: true };
  },
});

export const mirrorStoryImport = internalAction({
  args: {
    storyId: v.number(),
    duo_id: v.string(),
    name: v.string(),
    image: v.string(),
    set_id: v.number(),
    set_index: v.number(),
    author: v.number(),
    course_id: v.number(),
    text: v.string(),
    json: v.any(),
    operationKey: v.string(),
  },
  returns: v.object({
    inserted: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    await sql`INSERT INTO story (id, duo_id, name, author, image, set_id, set_index, course_id, text, json)
      VALUES (${args.storyId}, ${args.duo_id}, ${args.name}, ${args.author}, ${args.image}, ${args.set_id}, ${args.set_index}, ${args.course_id}, ${args.text}, ${args.json})`;
    await sql`SELECT setval(pg_get_serial_sequence('story', 'id'), (SELECT COALESCE(MAX(id), 1) FROM story))`;
    return { inserted: true };
  },
});

export const mirrorStoryApprovalToggle = internalAction({
  args: {
    storyId: v.number(),
    legacyUserId: v.number(),
    action: v.union(v.literal("added"), v.literal("deleted")),
    storyStatus: v.union(v.literal("draft"), v.literal("feedback"), v.literal("finished")),
    approvalCount: v.number(),
    finishedInSet: v.number(),
    publishedStoryIds: v.array(v.number()),
    datePublishedMs: v.union(v.number(), v.null()),
    courseId: v.id("courses"),
    courseCount: v.union(v.number(), v.null()),
    contributors: v.array(v.string()),
    contributorsPast: v.array(v.string()),
    operationKey: v.string(),
  },
  returns: v.object({
    updated: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();

    if (args.action === "deleted") {
      await sql`DELETE FROM story_approval WHERE story_id = ${args.storyId} AND user_id = ${args.legacyUserId}`;
    } else {
      const existing =
        await sql`SELECT id FROM story_approval WHERE story_id = ${args.storyId} AND user_id = ${args.legacyUserId} LIMIT 1`;
      if (!existing.length) {
        await sql`INSERT INTO story_approval (story_id, user_id) VALUES (${args.storyId}, ${args.legacyUserId})`;
      }
    }

    await sql`UPDATE story SET status = ${args.storyStatus}, approval_count = ${args.approvalCount} WHERE id = ${args.storyId}`;

    if (args.publishedStoryIds.length > 0 && args.datePublishedMs !== null) {
      const publishedAtIso = new Date(args.datePublishedMs).toISOString();
      await sql`UPDATE story
        SET public = true, date_published = ${publishedAtIso}
        WHERE id = ANY(${args.publishedStoryIds})`;
    }

    if (args.courseCount !== null) {
      await sql`UPDATE course SET count = ${args.courseCount} WHERE id = (SELECT course_id FROM story WHERE id = ${args.storyId} LIMIT 1)`;
    }

    await sql`UPDATE course
      SET contributors = ${args.contributors}, contributors_past = ${args.contributorsPast}
      WHERE id = (SELECT course_id FROM story WHERE id = ${args.storyId} LIMIT 1)`;

    return { updated: true };
  },
});

export const mirrorStoryPublishedToggle = internalAction({
  args: {
    storyId: v.number(),
    public: v.boolean(),
    courseLegacyId: v.number(),
    courseCount: v.number(),
    operationKey: v.string(),
  },
  returns: v.object({
    updated: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    const storyRows =
      await sql`UPDATE story SET public = ${args.public} WHERE id = ${args.storyId} RETURNING id`;
    await sql`UPDATE course SET count = ${args.courseCount} WHERE id = ${args.courseLegacyId}`;
    return { updated: storyRows.length > 0 };
  },
});

export const mirrorAdminApprovalDelete = internalAction({
  args: {
    storyId: v.number(),
    legacyApprovalId: v.number(),
    storyStatus: v.union(v.literal("draft"), v.literal("feedback"), v.literal("finished")),
    approvalCount: v.number(),
    operationKey: v.string(),
  },
  returns: v.object({
    updated: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const sql = getSqlClient();
    await sql`DELETE FROM story_approval WHERE id = ${args.legacyApprovalId}`;
    const storyRows =
      await sql`UPDATE story SET status = ${args.storyStatus}, approval_count = ${args.approvalCount} WHERE id = ${args.storyId} RETURNING id`;
    return { updated: storyRows.length > 0 };
  },
});
