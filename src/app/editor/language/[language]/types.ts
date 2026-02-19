import type { Id } from "@convex/_generated/dataModel";

export type AvatarNamesType = {
  id: number | null;
  avatar_id: number;
  language_id: number;
  name: string | null;
  link: string;
  speaker: string | null;
};

export type SpeakersType = {
  id: number;
  language_id: number;
  speaker: string;
  gender: string;
  type: string;
  service: string;
};

export type LanguageType = {
  languageId: Id<"languages">;
  id: number;
  name: string;
  short: string;
  speaker: string | null;
  default_text: string;
  tts_replace: string | null;
  public: boolean;
  rtl: boolean;
};

export type CourseStudType = {
  learning_language: number;
  from_language: number;
  short: string;
};
