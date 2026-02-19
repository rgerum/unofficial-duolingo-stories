import React from "react";
import { notFound } from "next/navigation";
import getUserId from "@/lib/getUserId";
import StoryWrapper from "./story_wrapper";
import { get_story } from "./getStory";
import LocalisationProvider from "@/components/LocalisationProvider";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { fetchAuthMutation } from "@/lib/auth-server";
import { fetchQuery } from "convex/nextjs";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? "";

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL/CONVEX_URL");
}

const convex = new ConvexHttpClient(convexUrl);

export async function generateMetadata({
  params,
}: {
  params: { story_id: string };
}) {
  const story_id = parseInt((await params).story_id);
  const story = await fetchQuery(api.storyRead.getStoryMetaByLegacyId, {
    storyId: story_id,
  });

  if (!story) notFound();

  return {
    title: `${story.from_language_name} - Duostories ${story.learning_language_long} from ${story.from_language_long}`,
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

export default async function Page({
  params,
}: {
  params: { story_id: string };
}) {
  const story_id = parseInt((await params).story_id);

  const story = await get_story(story_id);
  if (!story) notFound();
  const course_id = story.course_id;

  const user_id = await getUserId();

  async function setStoryDoneAction() {
    "use server";
    if (!user_id) {
      await convex.mutation(api.storyDone.recordStoryDone, {
        legacyStoryId: story_id,
        time: Date.now(),
      });
      return {
        message: "done",
        story_id: story_id,
      };
    }
    await fetchAuthMutation(api.storyDone.recordStoryDone, {
      legacyStoryId: story_id,
      time: Date.now(),
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
          //localization={localization}
        />
      </LocalisationProvider>
    </>
  );
}
