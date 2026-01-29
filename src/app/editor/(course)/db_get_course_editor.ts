import { cache } from "react";
import { sql } from "@/lib/db";
import { z } from "zod";

export const LanguageSchema = z.object({
  id: z.number(),
  short: z.string(),
  flag: z.nullable(z.number()),
  flag_file: z.nullable(z.string()),
});
export type LanguageProps = z.infer<typeof LanguageSchema>;

export const get_language_list_data = cache(async () => {
  let data = await sql`
                SELECT id, short, flag, flag_file
                FROM language
                `;
  let look_up: Record<string, LanguageProps> = {};
  for (let language of z.array(LanguageSchema).parse(data)) {
    look_up[language.short] = language as LanguageProps;
    look_up[language.id] = language as LanguageProps;
  }
  return look_up;
});

export const CourseSchema = z.object({
  id: z.number(),
  short: z.nullable(z.string()),
  about: z.nullable(z.string()),
  official: z.boolean(),
  count: z.number(),
  public: z.boolean(),
  from_language: z.number(),
  from_language_name: z.string(),
  learning_language: z.number(),
  learning_language_name: z.string(),
  contributors: z.array(z.string()),
  contributors_past: z.array(z.string()),
  todo_count: z.number(),
});
export type CourseProps = z.infer<typeof CourseSchema>;

export const get_course_list_data = cache(async () => {
  let data = await sql`
        SELECT id, short, about, official, count, public,
               from_language, from_language_name,
               learning_language, learning_language_name,
               contributors, contributors_past, todo_count
        FROM course
        ORDER BY count DESC
        `;
  return z.array(CourseSchema).parse(data);
});

export const get_course_data = cache(async (id: string | number) => {
  const data = await get_course_list_data();
  for (const d of data) {
    if (d.id == id || d.short == id) return d;
  }
});

export const StoryListDataSchema = z.object({
  id: z.number(),
  name: z.string(),
  course_id: z.number(),
  image: z.string(),
  set_id: z.number(),
  set_index: z.number(),
  date: z.date(),
  change_date: z.date(),
  status: z.string(),
  public: z.boolean(),
  todo_count: z.number(),
  approvals: z.nullable(z.array(z.number())),
  author: z.string(),
  author_change: z.nullable(z.string()),
});
export type StoryListDataProps = z.infer<typeof StoryListDataSchema>;

export const get_story_list_data = cache(async () => {
  const data = await sql`
        SELECT s.id, s.name, course_id, s.image, set_id, set_index, s.date, change_date, status, public, todo_count,
            ARRAY_AGG(a.user_id) AS approvals,
            u1.name as author,
            u2.name AS author_change
        FROM
            story s
        LEFT JOIN users u1 ON s.author = u1.id
        LEFT JOIN users u2 ON s.author_change = u2.id
        LEFT JOIN
            story_approval a ON s.id = a.story_id
        WHERE
            not deleted
        GROUP BY
            s.id, u1.name, u2.name
        ORDER BY
            course_id, set_id, set_index
        `;
  const data2 = data.filter((x) => !Number.isNaN(x.approvals[0]));
  const look_up: Record<number, StoryListDataProps[]> = {};
  for (const story of z.array(StoryListDataSchema).parse(data2)) {
    if (!look_up[story.course_id]) look_up[story.course_id] = [];
    look_up[story.course_id].push(story);
  }
  return look_up;
});

export const get_story_list = cache(async (course_id: number) => {
  const data = await get_story_list_data();
  return data[course_id] || [];
});

export const CourseImportSchema = z.object({
  id: z.number(),
  set_id: z.number(),
  set_index: z.number(),
  name: z.string(),
  image_done: z.string(),
  image: z.string(),
  copies: z.string(),
});
export type CourseImportProps = z.infer<typeof CourseImportSchema>;

export async function get_course_import({
  course_id,
  from_id,
}: {
  course_id: number;
  from_id: number;
}) {
  let courses = await sql`
SELECT 
    s1.id, 
    s1.set_id, 
    s1.set_index, 
    s1.name, 
    image.gilded AS image_done, 
    image.active AS image, 
    COUNT(s2.id) AS copies
FROM 
    story s1
LEFT JOIN (
    SELECT 
        s2.duo_id, 
        s2.id 
    FROM 
        story s2 
    WHERE 
        s2.course_id = ${course_id}
) AS s2 ON s1.duo_id = s2.duo_id
JOIN 
    image ON image.id = s1.image
WHERE 
    s1.course_id = ${from_id} AND NOT s1.deleted
GROUP BY 
    s1.id, s1.set_id, s1.set_index, s1.name, image.gilded, image.active
ORDER BY 
    s1.set_id, s1.set_index;`;
  return z.array(CourseImportSchema).parse(courses);
  //return courses.map((d) => {
  //  return { ...d };
  //});
}
