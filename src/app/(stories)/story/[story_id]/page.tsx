import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { fetchAuthQuery } from "@/lib/auth-server";
import getUserId from "@/lib/getUserId";
import {
  HIDE_STORY_QUESTIONS_COOKIE,
  isStoryQuestionsDisabled,
} from "@/lib/story-preferences";
import StoryWrapper from "./story_wrapper";
import { get_story } from "./getStory";
import StoryTranscript from "./StoryTranscript";
import { getStoryDescription, getStoryTitle } from "./story_seo";
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

// parseInt would accept alias slugs like "1abc" and serve story 1's content
// at infinitely many crawlable URLs; only pure integer slugs may resolve.
function parseStoryId(slug: string) {
  if (!/^\d+$/.test(slug)) notFound();
  const story_id = Number(slug);
  if (!Number.isSafeInteger(story_id)) notFound();
  return story_id;
}

// Deleted stories 308 to their course page (when the course is public) so
// accumulated links keep working; unknown ids 404. Shared by generateMetadata
// and Page — generateMetadata runs first, so it must redirect too or the
// notFound there would win before Page gets a chance.
async function resolveStoryMeta(story_id: number) {
  const storyMeta = await fetchQuery(api.storyRead.getStoryMetaByLegacyId, {
    storyId: story_id,
  });
  if (storyMeta && "deleted" in storyMeta) {
    if (storyMeta.coursePublic && storyMeta.courseShort) {
      permanentRedirect(`/${storyMeta.courseShort}`);
    }
    notFound();
  }
  if (!storyMeta) notFound();
  return storyMeta;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const story_id = parseStoryId((await params).story_id);
  const [story, storyMeta] = await Promise.all([
    get_story(story_id),
    resolveStoryMeta(story_id),
  ]);

  if (!story) notFound();

  const title = getStoryTitle(storyMeta);
  const description = getStoryDescription(story);

  if (!storyMeta.public) {
    return {
      title,
      description,
      robots: { index: false, follow: false },
      keywords: [
        storyMeta.learning_language_long,
        storyMeta.from_language_long,
      ],
      openGraph: {
        images: [
          `/api/og-story?title=${storyMeta.from_language_name}&image=${storyMeta.image}&name=${storyMeta.learning_language_long}`,
        ],
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
  const cookieStore = await cookies();
  const story_id = parseStoryId((await params).story_id);

  const story = await get_story(story_id);
  if (!story) {
    await resolveStoryMeta(story_id); // redirects deleted stories, else 404s
    notFound();
  }
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
              hideStoryQuestions={hideStoryQuestions}
              storyFinishedIndexUpdate={setStoryDoneAction}
              //localization={localization}
            />
          </Suspense>
        </div>
      </LocalisationProvider>
    </>
  );
}
