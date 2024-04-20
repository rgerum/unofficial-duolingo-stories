/*
const postgres = require("postgres");
const fs = require("node:fs/promises");
const { processStoryFile } = import(
  "./src/components/editor/story/syntax_parser_new.mjs"
);
 */
import postgres from "postgres";
import fs from "node:fs/promises";
import { processStoryFile } from "../src/components/editor/story/syntax_parser_new.mjs";

process.env.POSTGRES_URL =
    "postgresql://postgres:postgres@localhost:5432/duostories_test_db";

// will use psql environment variables
const sql = postgres(process.env.POSTGRES_URL);

async function load(filename) {
  return JSON.parse(await fs.readFile("database/" + filename));
}

async function main() {
  await sql`DELETE FROM story_approval`;
  await sql`DELETE FROM story`;
  await sql`DELETE FROM localization`;
  await sql`DELETE FROM avatar`;
  await sql`DELETE FROM image`;
  await sql`DELETE FROM course`;
  await sql`DELETE FROM language`;
  await sql`DELETE FROM users`;

  await sql`INSERT INTO users ${sql(await load("user.json"))}`;
  await sql`INSERT INTO language ${sql(await load("language.json"))}`;
  let courses = await load("course.json")
  await sql`INSERT INTO course ${sql(courses)}`;

  let avatar_data = await load("avatar.json");
  await sql`INSERT INTO avatar ${sql(avatar_data)}`;
  let avatar_by_id = {}
  for (let avatar of avatar_data) {
    avatar_by_id[avatar.id] = avatar
  }

  let image_data = await load("image.json");
  await sql`INSERT INTO image ${sql(image_data)}`;
  let image_by_id = {}
  for (let image of image_data) {
    image_by_id[image.id] = image
  }

  await sql`INSERT INTO localization ${sql(await load("localization.json"))}`;
  let courses_by_id = {}
  for (let course of courses) {
    courses_by_id[course.id] = course
  }
  let courses_by_tag = {}
  for (let course of courses) {
    courses_by_tag[course.short] = course
  }
  let path = "database/stories/"
  for(let file of await fs.readdir(path)) {
    let course = courses_by_tag[file];
    if (!course)
      continue
    for(let story of await fs.readdir(path + "/" + file)) {
      let [id, index, duo_id] = story.split("_", 3)
      duo_id = duo_id.slice(0, -4)
      let text = (await fs.readFile(path + "/" + file + "/" + story)).toString();
      const [story_json, story_meta, audio_insert_lines] = processStoryFile(
          text,
          0,
          avatar_by_id,
          {
            learning_language: "nl",
            from_language: "en",
          },
          "",
      );
      let image = image_by_id[story_meta.icon];
      story_json.illustrations = {
        active: image.active,
        gilded: image.gilded,
        locked: image.locked,
      };
      let story_entry = {
        set_id: parseInt(id),
        set_index: parseInt(index),
        duo_id: duo_id,
        course_id: course.id,
        text: text,
        json: story_json,
        author: course.official ? 11 : 12,
        image: story_meta.icon,
        name: story_meta.fromLanguageName,
        status: "draft",
        public: story_meta.public ? true : false,
        deleted: story_meta.deleted ? true : false,
      }
      if(story_meta.approvals) {
        story_meta.approvals = story_meta.approvals.split(",")
        if(story_meta.approvals.length===1) {
          story_entry.status = "feedback"
        }
        if(story_meta.approvals.length>=2) {
          story_entry.status = "finished"
        }
      }
      let story_id = (await sql`INSERT INTO story ${sql(story_entry)} RETURNING id`)[0].id;
      if(story_meta.approvals) {
        for(let approval of story_meta.approvals) {
          await sql`INSERT INTO story_approval ${sql({story_id: story_id, user_id: parseInt(approval)})}`;
        }
      }
    }
  }
  // add generated fields
  await sql`UPDATE course
SET count = (
    SELECT COUNT(*)
    FROM story
    WHERE story.course_id = course.id AND story.public AND NOT story.deleted
);`
  await sql`
UPDATE course
SET learning_language_name = (
    SELECT name
    FROM language
    WHERE language.id = course.learning_language
), from_language_name = (
    SELECT name
    FROM language
    WHERE language.id = course.from_language
);
`
  await sql`SELECT setval('language_id_seq', COALESCE((SELECT MAX(id) FROM language), 0) + 1, false);`
  await sql`SELECT setval('course_id_seq', COALESCE((SELECT MAX(id) FROM course), 0) + 1, false);`
  sql.end();
  //await sql`INSERT INTO story_approval ${sql(await load("approvals.json"))}`;
  console.log("done");
}
main();
