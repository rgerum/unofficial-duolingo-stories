import { sql } from "@/lib/db";
import { CourseList } from "./courses";
import { z } from "zod";

const course_schema = z.object({
  id: z.number(),
  learning_language: z.number(),
  from_language: z.number(),
  public: z.boolean(),
  official: z.boolean(),
  name: z.string().nullable(),
  about: z.string().nullable(),
  conlang: z.boolean(),
  short: z.string().nullable(),
  tags: z.array(z.string()),
});

export type CourseProps = z.infer<typeof course_schema>;

async function course_list() {
  const query_result = await sql`SELECT
    course.id,
    course.learning_language,
    course.from_language,
    course.public,
    course.official,
    course.name,
    course.about,
    course.conlang,
    course.short,
    course.tags
FROM course ORDER BY course.id;
`;
  return course_schema.array().parse(query_result);
}

const LanguageSchema = z.object({
  id: z.number(),
  name: z.string(),
  short: z.string(),
  flag: z.nullable(z.number()),
  flag_file: z.string().nullable(),
  speaker: z.string().nullable(),
  default_text: z.string().nullable(),
  tts_replace: z.nullable(z.string()),
  public: z.boolean(),
  rtl: z.boolean(),
});

export type AdminLanguageProps = z.infer<typeof LanguageSchema>;

async function language_list() {
  const query_result = await sql`SELECT * FROM language;`;
  return LanguageSchema.array().parse(query_result);
}

export default async function Page({}) {
  let courses = await course_list();
  let languages = await language_list();

  return <CourseList all_courses={courses} languages={languages} />;
}
