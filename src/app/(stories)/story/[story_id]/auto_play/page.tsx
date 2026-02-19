import React from "react";
import StoryWrapper from "./story_wrapper";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

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
      canonical: `https://duostories.org/story/${story_id}/auto_play`,
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
  params: Promise<{ story_id: string }>;
}) {
  const story_id = parseInt((await params).story_id);
  if (!Number.isFinite(story_id)) notFound();

  return <StoryWrapper storyId={story_id} />;
}
