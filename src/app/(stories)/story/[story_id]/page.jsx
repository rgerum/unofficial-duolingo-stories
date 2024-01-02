import React from "react";

import { sql } from "lib/db";

import StoryWrapper from "./story_wrapper";
import { notFound } from "next/navigation";
import getUserId from "lib/getUserId";
import { get_localisation_dict } from "lib/get_localisation";

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

export async function get_story_meta(course_id) {
  const course_query = await sql`SELECT
        story.name AS from_language_name,
        l1.name AS from_language_long,
        l2.name AS learning_language_long
    FROM story 
    JOIN course c on story.course_id = c.id 
    LEFT JOIN language l1 ON l1.id = c.from_language
    LEFT JOIN language l2 ON l2.id = c.learning_language 
    WHERE story.id = ${course_id};`;
  if (course_query.length === 0) return undefined;
  return Object.assign({}, course_query[0]);
}

export async function generateMetadata({ params, searchParams }, parent) {
  const story = await get_story_meta(params.story_id);

  if (!story) notFound();

  const meta = await parent;

  return {
    title: `Duostories ${story.learning_language_long} from ${story.from_language_long}: ${story.from_language_name}`,
    alternates: {
      canonical: `https://duostories.org/story/${params.story_id}`,
    },
    keywords: [story.learning_language_long, ...meta.keywords],
  };
}

export default async function Page({ params }) {
  const story = await get_story(params.story_id);

  const user_id = await getUserId();
  const story_id = parseInt(params.story_id);

  const localization = await get_localisation_dict(story?.from_language_id);

  async function setStoryDoneAction() {
    "use server";
    if (!user_id) {
      await sql`INSERT INTO story_done (story_id) VALUES(${story_id})`;
      return { message: "done", story_id: story_id };
    }
    await sql`INSERT INTO story_done (user_id, story_id) VALUES(${user_id}, ${story_id})`;
    return { message: "done", story_id: story_id };
  }

  return (
    <>
      <StoryWrapper
        story={story}
        storyFinishedIndexUpdate={setStoryDoneAction}
        localization={localization}
      />
    </>
  );
}
