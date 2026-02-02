import React from "react";
import { notFound } from "next/navigation";
import getUserId from "@/lib/getUserId";
import StoryWrapper from "./story_wrapper";
import { get_story, get_story_meta } from "../getStory_convex";
import LocalisationProvider from "@/components/LocalisationProvider";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { headers } from "next/headers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const story_id = parseInt((await params).story_id);
  const story = await get_story_meta(story_id);

  if (!story) notFound();

  return {
    title: `Duostories ${story.learning_language_long} from ${story.from_language_long}: ${story.from_language_name}`,
    alternates: {
      canonical: `https://duostories.org/story/${story_id}`,
    },
    keywords: [story.learning_language_long],
  };
}

async function getNavigationMode() {
  const headersList = await headers();
  // If there is a next-url header, soft navigation has been performed
  // Otherwise, hard navigation has been performed
  const nextUrl = headersList.get("next-url");
  if (nextUrl) {
    return "soft";
  }
  return "hard";
}

export default async function Page({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const story_id = parseInt((await params).story_id);
  const story = await get_story(story_id);
  if (!story) notFound();
  const course_id = story?.course_id;

  const user_id = await getUserId();

  async function setStoryDoneAction() {
    "use server";
    const result = await fetchMutation(api.storyCompletions.markCompleteByLegacyId, {
      storyLegacyId: story_id,
      userLegacyId: user_id ?? undefined,
    });

    return {
      message: "done",
      story_id: story_id,
      course_id: course_id,
    };
  }

  return (
    <>
      <LocalisationProvider lang={story.from_language_id}>
        <StoryWrapper
          story={story}
          storyFinishedIndexUpdate={setStoryDoneAction}
          show_title_page={(await getNavigationMode()) === "hard"}
        />
      </LocalisationProvider>
    </>
  );
}
