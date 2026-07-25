import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import getUserId from "@/lib/getUserId";
import StoryWrapper from "./story_wrapper";
import { get_story } from "./getStory";
import StoryTranscript from "./StoryTranscript";
import { getStoryDescription, getStoryTitle } from "./story_seo";
import LocalisationProvider from "@/components/LocalisationProvider";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { fetchAuthMutation } from "@/lib/auth-server";

export const revalidate = 86400;
export const dynamic = "force-static";

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

  const title = getStoryTitle(storyMeta);
  const description = getStoryDescription(story);

  return {
    title,
    description,
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
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const story_id = parseInt((await params).story_id);

  const story = await get_story(story_id);
  if (!story) notFound();
  const course_id = story.course_id;

  async function setStoryDoneAction() {
    "use server";
    const user_id = await getUserId();

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
          [data-story-no-js="true"] { display: block; }
          html[data-story-js="true"] [data-story-js-only="true"] { display: block; }
          html[data-story-js="true"] [data-story-no-js="true"] { display: none; }
          html[data-story-js="true"] [data-story-future="true"] { display: none; }
        `}</style>
        <div data-story-no-js="true">
          <StoryTranscript story={story} />
        </div>
        <div data-story-js-only="true">
          <Suspense fallback={null}>
            <StoryWrapper
              story={story}
              storyFinishedIndexUpdate={setStoryDoneAction}
              //localization={localization}
            />
          </Suspense>
        </div>
      </LocalisationProvider>
    </>
  );
}
