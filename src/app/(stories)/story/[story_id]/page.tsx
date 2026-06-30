import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { fetchAuthQuery } from "@/lib/auth-server";
import getUserId from "@/lib/getUserId";
import {
  HIDE_STORY_QUESTIONS_COOKIE,
  isStoryQuestionsDisabled,
} from "@/lib/story-preferences";
import StoryWrapper from "./story_wrapper";
import { get_story } from "./getStory";
import { getStoryDescription } from "./story_seo";
import LocalisationProvider from "@/components/LocalisationProvider";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { fetchAuthMutation } from "@/lib/auth-server";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? "";

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL/CONVEX_URL");
}

const convex = new ConvexHttpClient(convexUrl);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const story_id = parseInt((await params).story_id);
  const [story, storyMeta] = await Promise.all([
    get_story(story_id),
    fetchQuery(api.storyRead.getStoryMetaByLegacyId, {
      storyId: story_id,
    }),
  ]);

  if (!story || !storyMeta) notFound();

  return {
    title: `${storyMeta.from_language_name} - Duostories ${storyMeta.learning_language_long} from ${storyMeta.from_language_long}`,
    description: getStoryDescription(story),
    alternates: {
      canonical: `https://duostories.org/story/${story_id}`,
    },
    keywords: [storyMeta.learning_language_long, storyMeta.from_language_long],
    openGraph: {
      images: [
        `/api/og-story?title=${storyMeta.from_language_name}&image=${storyMeta.image}&name=${storyMeta.learning_language_long}`,
      ],
      url: `https://duostories.org/story/${story_id}`,
      type: "website",
      description: getStoryDescription(story),
    },
    twitter: {
      description: getStoryDescription(story),
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const cookieStore = await cookies();
  const story_id = parseInt((await params).story_id);

  const story = await get_story(story_id);
  if (!story) notFound();
  const course_id = story.course_id;

  const user_id = await getUserId();
  const cookieHideStoryQuestions = isStoryQuestionsDisabled(
    cookieStore.get(HIDE_STORY_QUESTIONS_COOKIE)?.value,
  );
  const savedStoryPreferences = user_id
    ? ((await fetchAuthQuery(
        api.userPreferences.getCurrentStoryPreferences,
        {},
      )) as {
        hasSavedPreference: boolean;
        hideStoryQuestions: boolean;
      })
    : null;
  const hideStoryQuestions =
    savedStoryPreferences?.hasSavedPreference === true
      ? savedStoryPreferences.hideStoryQuestions
      : cookieHideStoryQuestions;
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
        <style>{`
          [data-story-js-only="true"] { display: none; }
          html[data-story-js="true"] [data-story-js-only="true"] { display: block; }
          html[data-story-js="true"] [data-story-future="true"] { display: none; }
        `}</style>
        <Suspense fallback={null}>
          <StoryWrapper
            story={story}
            hideStoryQuestions={hideStoryQuestions}
            storyFinishedIndexUpdate={setStoryDoneAction}
            //localization={localization}
          />
        </Suspense>
      </LocalisationProvider>
    </>
  );
}
