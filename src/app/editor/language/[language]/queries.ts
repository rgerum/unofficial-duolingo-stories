import { cache } from "react";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
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
  const data = await fetchQuery(api.editor.getAvatarNamesForEditor, {
    languageLegacyId: id,
  });
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
  const data = await fetchQuery(api.editor.getSpeakers, {
    languageLegacyId: id,
  });
  return z.array(SpeakersSchema).parse(data);
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
  const result = await fetchQuery(api.editor.getLanguageWithCourse, { id });

  if (!result) {
    throw new Error(`Language not found for id: ${id}`);
  }

  const language = LanguageSchema.parse(result.language);
  const course = result.course ? CourseStudSchema.parse(result.course) : undefined;
  const fromLanguage = result.fromLanguage ? LanguageSchema.parse(result.fromLanguage) : undefined;

  return [language, course, fromLanguage] as const;
});
