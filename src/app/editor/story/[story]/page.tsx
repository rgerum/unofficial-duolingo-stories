import React from "react";
import { notFound } from "next/navigation";
import Editor from "./editor";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { Metadata } from "next";

export type StoryData = {
  id: number;
  official: boolean;
  course_id: number;
  duo_id: string;
  image: string;
  name: string;
  set_id: number;
  set_index: number;
  text: string;
  short: string;
  learning_language: number;
  from_language: number;
};

export type Avatar = {
  id: number;
  avatar_id: number;
  language_id: number;
  name: string;
  link: string;
  speaker: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ story: number }>;
}): Promise<Metadata> {
  const story = (await params).story;
  const story_data = await fetchQuery(api.editor.getStoryForEditor, {
    storyLegacyId: Number(story),
  });

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
  const story_data = await fetchQuery(api.editor.getStoryForEditor, {
    storyLegacyId: Number(story),
  });

  if (!story_data) {
    notFound();
  }

  // Convert to the format expected by Editor
  const storyDataFormatted: StoryData = {
    id: story_data.id,
    official: story_data.official,
    course_id: story_data.course_id,
    duo_id: story_data.duo_id,
    image: story_data.image,
    name: story_data.name,
    set_id: story_data.set_id,
    set_index: story_data.set_index,
    text: story_data.text,
    short: story_data.short ?? "",
    learning_language: story_data.learning_language,
    from_language: story_data.from_language,
  };

  // Get avatar names for the learning language (returns array)
  const avatar_names_data = await fetchQuery(api.editor.getAvatarNames, {
    languageLegacyId: story_data.learning_language,
  });

  // Convert array to the format expected by Editor (Record keyed by avatar_id)
  const avatar_names: Record<number, Avatar> = {};
  for (const avatar of avatar_names_data) {
    avatar_names[avatar.avatar_id] = {
      id: avatar.id,
      avatar_id: avatar.avatar_id,
      language_id: avatar.language_id,
      name: avatar.name,
      link: avatar.link,
      speaker: avatar.speaker,
    };
  }

  return <Editor story_data={storyDataFormatted} avatar_names={avatar_names} />;
}
