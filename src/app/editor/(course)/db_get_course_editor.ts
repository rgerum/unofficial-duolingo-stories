import { cache } from "react";
import { sql } from "@/lib/db";

export interface LanguageProps {
  id: number;
  short: string;
  flag: number;
  flag_file: string;
}

export const get_language_list_data = cache(async () => {
  let data = await sql`
                SELECT id, short, flag, flag_file
                FROM language
                `;
  let look_up: Record<string, LanguageProps> = {};
  for (let language of data) {
    look_up[language.short] = language as LanguageProps;
    look_up[language.id] = language as LanguageProps;
  }
  return look_up;
});

export interface CourseProps {
  id: number;
  short: string;
  about: string;
  official: boolean;
  count: number;
  public: boolean;
  from_language: string;
  from_language_name: string;
  learning_language: string;
  learning_language_name: string;
  contributors: string[];
  contributors_past: string[];
  todo_count: number;
}

export const get_course_list_data = cache(async () => {
  let data = await sql`
        SELECT id, short, about, official, count, public,
               from_language, from_language_name,
               learning_language, learning_language_name,
               contributors, contributors_past, todo_count
        FROM course
        ORDER BY count DESC
        `;
  return data as unknown as CourseProps[];
});

export const get_course_data = cache(async (id: string | number) => {
  const data = await get_course_list_data();
  for (let d of data) {
    if (d.id == id || d.short == id) return d;
  }
});

export interface StoryListDataProps {
  id: string;
  name: string;
  course_id: number;
  image: string;
  set_id: number;
  set_index: number;
  date: Date;
  change_date: Date;
  status: string;
  public: boolean;
  todo_count: number;
  approvals: number[];
  author: string;
  author_change: string;
}

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
  let look_up: Record<number, StoryListDataProps[]> = {};
  for (let story of data) {
    if (!look_up[story.course_id]) look_up[story.course_id] = [];
    look_up[story.course_id].push(story as StoryListDataProps);
  }
  return look_up;
});

export const get_story_list = cache(async (course_id: number) => {
  const data = await get_story_list_data();
  return data[course_id] || [];
});

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
  return courses.map((d) => {
    return { ...d };
  });
}
