import React from "react";
import { notFound } from "next/navigation";
import StoryWrapper from "./story_wrapper";
import { get_story } from "../getStory";
import LocalisationProvider from "@/components/LocalisationProvider";
import { headers } from "next/headers";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const story_id = parseInt((await params).story_id);
  const story = await fetchQuery(api.storyRead.getStoryMetaByLegacyId, {
    storyId: story_id,
  });

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

  async function setStoryDoneAction() {
    "use server";
    return {
      message: "done",
    };
  }

  return (
    <>
      <LocalisationProvider lang={story.from_language_id}>
        <StoryWrapper
          story={story}
          storyFinishedIndexUpdate={setStoryDoneAction}
          //localization={localization}
          show_title_page={(await getNavigationMode()) === "hard"}
        />
      </LocalisationProvider>
    </>
  );
}
