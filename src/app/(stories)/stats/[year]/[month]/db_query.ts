import { sql } from "@/lib/db";
import { z } from "zod";

const StatsSchema1 = z.object({
  course_id: z.number(),
  count: z.number(),
});

const CourseSchema = z.object({
  id: z.number(),
  learning_language: z.number(),
  from_language: z.number(),
  public: z.boolean(),
});

export type StatsCourseProps = z.infer<typeof CourseSchema>;

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

export type StatsLanguageProps = z.infer<typeof LanguageSchema>;

export async function get_stats(year: number, month: number) {
  const query1 =
    await sql`SELECT course_id, COUNT(s.course_id)::int AS count FROM story s
         WHERE EXTRACT(MONTH FROM s.date_published) = ${month} AND
         EXTRACT(YEAR FROM s.date_published) = ${year}
    GROUP BY course_id ORDER BY count DESC;`;
  const res = z.array(StatsSchema1).parse(query1);

  const query2 =
    await sql`SELECT course_id, COUNT(s.course_id)::int AS count FROM story_done sd
        JOIN story s on s.id = sd.story_id
         WHERE EXTRACT(MONTH FROM sd.time) = ${month} AND
         EXTRACT(YEAR FROM sd.time) = ${year}
    GROUP BY course_id ORDER BY count DESC;`;
  const res2 = z.array(StatsSchema1).parse(query2);

  const query3 =
    await sql`SELECT s.course_id, COUNT(DISTINCT(sd.user_id))::int AS count FROM story_done sd
        JOIN story s on s.id = sd.story_id
         WHERE EXTRACT(MONTH FROM sd.time) = ${month} AND
         EXTRACT(YEAR FROM sd.time) = ${year}
    GROUP BY course_id ORDER BY count DESC;`;
  const res3 = z.array(StatsSchema1).parse(query3);

  const query3b =
    await sql`SELECT COUNT(DISTINCT(sd.user_id)) AS count FROM story_done sd
         WHERE EXTRACT(MONTH FROM sd.time) = ${month} AND
         EXTRACT(YEAR FROM sd.time) = ${year}
    GROUP BY EXTRACT(YEAR FROM sd.time) ORDER BY count DESC;`;
  const res3_count = parseInt(query3b[0]?.count) || 0;

  const query4 =
    await sql`SELECT s.course_id, COUNT(DISTINCT(sd.story_id))::int AS count FROM story_done sd
        JOIN story s on s.id = sd.story_id
         WHERE EXTRACT(MONTH FROM sd.time) = ${month} AND
         EXTRACT(YEAR FROM sd.time) = ${year}
    GROUP BY course_id ORDER BY count DESC;`;
  const res4 = z.array(StatsSchema1).parse(query4);

  const query_course =
    await sql`SELECT c.id, c.learning_language, c.from_language, c.public FROM course c JOIN language l on l.id = c.learning_language ORDER BY l.name;`;
  const res_course = z.array(CourseSchema).parse(query_course);
  const query_languages = await sql`SELECT * FROM language;`;
  const res_languages = z.array(LanguageSchema).parse(query_languages);

  return {
    year,
    month,
    stories_published: res,
    stories_read: res2,
    active_users: res3,
    active_users_count: res3_count,
    active_stories: res4,
    courses: res_course,
    languages: res_languages,
  };
}
