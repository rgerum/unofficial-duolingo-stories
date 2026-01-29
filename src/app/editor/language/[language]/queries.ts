import { cache } from "react";
import { sql } from "@/lib/db";
import { z } from "zod";

const AvatarNamesSchema = z.object({
  id: z.nullable(z.number()),
  avatar_id: z.number(),
  language_id: z.nullable(z.number()),
  name: z.nullable(z.string()),
  link: z.string(),
  speaker: z.nullable(z.string()),
});
export type AvatarNamesType = z.infer<typeof AvatarNamesSchema>;

export const get_avatar_names = cache(async (id: number) => {
  const data = await sql`
SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker
FROM (SELECT id, name, speaker, language_id, avatar_id FROM avatar_mapping WHERE language_id = ${id}) as avatar_mapping
RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id
WHERE a.link != '[object Object]'
ORDER BY a.id
    `;
  return z.array(AvatarNamesSchema).parse(data);
});

const SpeakersSchema = z.object({
  id: z.number(),
  language_id: z.number(),
  speaker: z.string(),
  gender: z.string(),
  type: z.string(),
  service: z.string(),
});
export type SpeakersType = z.infer<typeof SpeakersSchema>;

export const get_speakers = cache(async (id: number) => {
  return z
    .array(SpeakersSchema)
    .parse(await sql`SELECT * FROM speaker WHERE language_id = ${id}`);
});

const LanguageSchema = z.object({
  id: z.number(),
  name: z.string(),
  short: z.string(),
  flag: z.number(),
  flag_file: z.nullable(z.string()),
  speaker: z.nullable(z.string()),
  default_text: z.string(),
  tts_replace: z.nullable(z.string()),
  public: z.boolean(),
  rtl: z.boolean(),
});
export type LanguageType = z.infer<typeof LanguageSchema>;

export const CourseStudSchema = z.object({
  learning_language: z.number(),
  from_language: z.number(),
  short: z.string(),
});

export const get_language = cache(async (id: string) => {
  const isNumeric = (value: string) =>
    value.length !== 0 && [...value].every((c) => c >= "0" && c <= "9");
  if (isNumeric(id)) {
    return [
      LanguageSchema.parse(
        (await sql`SELECT * FROM language WHERE id = ${id} LIMIT 1`)[0],
      ),
      undefined,
      undefined,
    ] as const;
  } else {
    const course = (
      await sql`SELECT learning_language, from_language, short FROM course WHERE short = ${id} LIMIT 1`
    )[0];
    if (course) {
      id = course.learning_language;
      let id2 = course.from_language;
      return [
        LanguageSchema.parse(
          (await sql`SELECT * FROM language WHERE id = ${id} LIMIT 1`)[0],
        ),
        CourseStudSchema.parse(course),
        LanguageSchema.parse(
          (await sql`SELECT * FROM language WHERE id = ${id2} LIMIT 1`)[0],
        ),
      ] as const;
    }
    return [
      LanguageSchema.parse(
        (await sql`SELECT * FROM language WHERE short = ${id} LIMIT 1`)[0],
      ),
      undefined,
      undefined,
    ] as const;
  }
});
