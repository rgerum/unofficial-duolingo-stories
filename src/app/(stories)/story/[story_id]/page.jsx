import React from "react";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import getUserId from "@/lib/getUserId";
import { get_localisation_dict } from "@/lib/get_localisation";
import StoryWrapper from "./story_wrapper";
import { get_story } from "./getStory";
import { revalidateTag } from "next/cache";
import LocalisationProvider from "@/components/LocalisationProvider";

async function get_story_meta(course_id) {
  const course_query = await sql`SELECT
        story.name AS from_language_name,
        story.image,
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

export async function generateMetadata({ params }) {
  const story_id = (await params).story_id;
  const story = await get_story_meta(story_id);

  if (!story) notFound();

  return {
    title: `Duostories ${story.learning_language_long} from ${story.from_language_long}: ${story.from_language_name}`,
    alternates: {
      canonical: `https://duostories.org/story/${story_id}`,
    },
    keywords: [story.learning_language_long],
    openGraph: {
      images: [
        `/api/og-story?title=${story.from_language_name}&image=${story.image}&name=${story.learning_language_long}`,
      ],
      url: `https://duostories.org/story/${story_id}`,
      type: "website",
    },
  };
}

export default async function Page({ params }) {
  const story = await get_story((await params).story_id);
  const course_id = story?.course_id;

  const user_id = await getUserId();
  const story_id = parseInt(params.story_id);

  const localization = await get_localisation_dict(story?.from_language_id);

  async function setStoryDoneAction() {
    "use server";
    if (!user_id) {
      await sql`INSERT INTO story_done (story_id) VALUES(${story_id})`;
      return {
        message: "done",
        story_id: story_id,
      };
    }
    await sql`INSERT INTO story_done (user_id, story_id) VALUES(${user_id}, ${story_id})`;
    revalidateTag(`course_done_${course_id}_${user_id}`);
    return {
      message: "done",
      story_id: story_id,
      course_id: course_id,
    };
  }

  return (
    <>
      <LocalisationProvider lang={story.fromLanguage}>
        <StoryWrapper
          story={story}
          storyFinishedIndexUpdate={setStoryDoneAction}
          localization={localization}
        />
      </LocalisationProvider>
    </>
  );
}
