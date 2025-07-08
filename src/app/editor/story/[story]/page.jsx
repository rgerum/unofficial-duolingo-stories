import React from "react";
import { notFound } from "next/navigation";
import Editor from "./editor";

import { sql } from "@/lib/db.ts";

async function get_story({ id }) {
  return (
    await sql`SELECT story.id, c.official as official, course_id, duo_id, image, 
       story.name, set_id, set_index, text, c.short, c.learning_language as learning_language,
       c.from_language as from_language FROM story JOIN course c on story.course_id = c.id WHERE story.id = ${id} LIMIT 1
`
  )[0];
}

async function get_avatar_names({ id, course_id }) {
  if (id === 0) {
    return await sql`SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker FROM avatar_mapping RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id WHERE (language_id = (SELECT learning_language FROM course WHERE id = ${course_id}) or language_id is NULL) ORDER BY a.id`;
  } else {
    return await sql`SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker FROM (SELECT * FROM avatar_mapping WHERE language_id = ${id}) as avatar_mapping RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id ORDER BY a.id`;
  }
}

async function getAvatarsList(id) {
  if (!id) return {};
  let avatar_names_list = await get_avatar_names({ id });
  let avatar_names = {};
  for (let avatar of avatar_names_list) {
    avatar_names[avatar.avatar_id] = avatar;
  }
  return avatar_names;
}

export async function generateMetadata({ params }) {
  const story = (await params).story;
  let story_data = await get_story({ id: story });

  if (!story_data) notFound();

  return {
    title: `${story_data.name} | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/story/${story_data.id}`,
    },
  };
}

export default async function Page({ params }) {
  const story = (await params).story;
  let story_data = await get_story({ id: story });

  if (!story_data) {
    notFound();
  }

  let avatar_names = await getAvatarsList(story_data?.learning_language);

  return <Editor story_data={story_data} avatar_names={avatar_names} />;
}
