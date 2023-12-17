import { sql } from "lib/db";

export async function get_stats(year, month) {
  let res = await sql`SELECT course_id, COUNT(s.course_id) AS count FROM story s
         WHERE EXTRACT(MONTH FROM s.date_published) = ${month} AND
         EXTRACT(YEAR FROM s.date_published) = ${year}
    GROUP BY course_id ORDER BY count DESC;`;
  res = res.map((d) => Object.assign({}, d));

  let res2 = await sql(
    `SELECT course_id, COUNT(s.course_id) AS count FROM story_done sd
        JOIN story s on s.id = sd.story_id
         WHERE EXTRACT(MONTH FROM sd.time) = ? AND
         EXTRACT(YEAR FROM sd.time) = ?
    GROUP BY course_id ORDER BY count DESC;`,
    [month, year],
  );
  res2 = res2.map((d) => Object.assign({}, d));

  let res3 =
    await sql`SELECT s.course_id, COUNT(DISTINCT(sd.user_id)) AS count FROM story_done sd
        JOIN story s on s.id = sd.story_id
         WHERE EXTRACT(MONTH FROM sd.time) = ${month} AND
         EXTRACT(YEAR FROM sd.time) = ${year}
    GROUP BY course_id ORDER BY count DESC;`;
  res3 = res3.map((d) => Object.assign({}, d));

  let res3b =
    await sql`SELECT COUNT(DISTINCT(sd.user_id)) AS count FROM story_done sd
         WHERE EXTRACT(MONTH FROM sd.time) = ${month} AND
         EXTRACT(YEAR FROM sd.time) = ${year}
    GROUP BY EXTRACT(YEAR FROM sd.time) ORDER BY count DESC;;`;
  res3.count = res3b[0].count;

  let res4 =
    await sql`SELECT s.course_id, COUNT(DISTINCT(sd.story_id)) AS count FROM story_done sd
        JOIN story s on s.id = sd.story_id
         WHERE EXTRACT(MONTH FROM sd.time) = ${month} AND
         EXTRACT(YEAR FROM sd.time) = ${year}
    GROUP BY course_id ORDER BY count DESC;`;
  res4 = res4.map((d) => Object.assign({}, d));

  let res_course =
    await sql`SELECT c.id, c.learning_language, c.from_language, c.public FROM course c JOIN language l on l.id = c.learning_language ORDER BY l.name;`;
  res_course = res_course.map((d) => Object.assign({}, d));
  let res_languages = await sql`SELECT * FROM language;`;
  res_languages = res_languages.map((d) => Object.assign({}, d));

  return {
    stories_published: res,
    stories_read: res2,
    active_users: res3,
    active_users_count: res3b[0].count,
    active_stories: res4,
    courses: res_course,
    languages: res_languages,
  };
}
