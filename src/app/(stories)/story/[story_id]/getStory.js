import { sql } from "lib/db";

export async function get_story(story_id) {
  let res =
    await sql`SELECT l1.short AS from_language, l2.short AS learning_language, c.from_language as from_language_id,
              l1.name AS from_language_long, l2.name AS learning_language_long, 
              story.name AS from_language_name,
              l1.rtl AS from_language_rtl, l2.rtl AS learning_language_rtl,
              story.id, story.json 
              FROM story 
              JOIN course c on story.course_id = c.id 
              LEFT JOIN language l1 ON l1.id = c.from_language
              LEFT JOIN language l2 ON l2.id = c.learning_language 
              WHERE story.id = ${story_id};`;
  if (res.length === 0) {
    //result.sendStatus(404);
    return;
  }
  let data = res[0]["json"];
  data.id = res[0]["id"];

  data.from_language = res[0]["from_language"];
  data.from_language_id = res[0]["from_language_id"];
  data.from_language_long = res[0]["from_language_long"];
  data.from_language_rtl = res[0]["from_language_rtl"];
  data.from_language_name = res[0]["from_language_name"];

  data.learning_language = res[0]["learning_language"];
  data.learning_language_long = res[0]["learning_language_long"];
  data.learning_language_rtl = res[0]["learning_language_rtl"];
  return data;
}
