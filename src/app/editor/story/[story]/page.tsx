import React from "react";
import { notFound } from "next/navigation";
import Editor from "./editor";

import { sql } from "@/lib/db";
import { Metadata } from "next";

export type StoryData = {
  id: number;
  official: boolean;
  course_id: number;
  duo_id: number;
  image: string;
  name: string;
  set_id: number;
  set_index: number;
  text: string;
  short: string;
  learning_language: number;
  from_language: number;
};
async function get_story({ id }: { id: number }) {
  return (
    await sql`SELECT story.id, c.official as official, course_id, duo_id, image,
       story.name, set_id, set_index, text, c.short, c.learning_language as learning_language,
       c.from_language as from_language FROM story JOIN course c on story.course_id = c.id WHERE story.id = ${id} LIMIT 1
`
  )[0] as StoryData;
}

export type Avatar = {
  id: number;
  avatar_id: number;
  language_id: number;
  name: string;
  link: string;
  speaker: string;
};

async function get_avatar_names({
  id,
  course_id,
}: {
  id: number;
  course_id?: number | undefined;
}): Promise<Avatar[]> {
  let avatar;
  if (typeof course_id !== "undefined") {
    avatar =
      await sql`SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker FROM avatar_mapping RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id WHERE (language_id = (SELECT learning_language FROM course WHERE id = ${course_id}) or language_id is NULL) ORDER BY a.id`;
  } else {
    avatar =
      await sql`SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker FROM (SELECT * FROM avatar_mapping WHERE language_id = ${id}) as avatar_mapping RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id ORDER BY a.id`;
  }
  //console.log("get_avatar_names", avatar);
  return avatar as unknown as Avatar[];
}

async function getAvatarsList(id: number) {
  if (!id) return {};
  const avatar_names_list = await get_avatar_names({ id });
  const avatar_names: Record<number, Avatar> = {};
  for (const avatar of avatar_names_list) {
    avatar_names[avatar.avatar_id] = avatar;
  }
  return avatar_names;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ story: number }>;
}): Promise<Metadata> {
  const story = (await params).story;
  const story_data = await get_story({ id: story });

  if (!story_data) notFound();

  return {
    title: `${story_data.name} | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/story/${story_data.id}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ story: number }>;
}) {
  const story = (await params).story;
  const story_data = await get_story({ id: story });

  if (!story_data) {
    notFound();
  }

  const avatar_names = await getAvatarsList(story_data?.learning_language);

  return <Editor story_data={story_data} avatar_names={avatar_names} />;
}
