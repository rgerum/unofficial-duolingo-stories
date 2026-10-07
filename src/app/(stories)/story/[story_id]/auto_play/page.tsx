import React from "react";
import StoryWrapper from "./story_wrapper";
import { notFound } from "next/navigation";
import { get_story_meta } from "../getStory";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: { story_id: string };
}) {
  const story_id = parseInt((await params).story_id);
  const story = await get_story_meta(story_id);

  if (!story || "deleted" in story) notFound();

  return {
    title: `${story.from_language_name} - Duostories ${story.learning_language_long} from ${story.from_language_long}`,
    alternates: {
      canonical: `https://duostories.org/story/${story_id}/auto_play`,
    },
    keywords: [story.learning_language_long],
    openGraph: {
      images: [
        `/api/og-story?title=${story.from_language_name}&image=${story.image}&name=${story.learning_language_long}`,
      ],
      url: `https://duostories.org/story/${story_id}/auto_play`,
      type: "website",
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const story_id = parseInt((await params).story_id);
  if (!Number.isFinite(story_id)) notFound();

  return <StoryWrapper storyId={story_id} />;
}
