import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import StoryEditorPageClient from "./page_client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ story: number }>;
}): Promise<Metadata> {
  const storyId = Number((await params).story);
  const story = await fetchQuery(api.editorRead.getEditorStoryPageData, {
    storyId,
  });

  if (!story) notFound();

  return {
    title: `${story.story_data.name} | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/story/${story.story_data.id}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ story: number }>;
}) {
  const storyId = Number((await params).story);
  return <StoryEditorPageClient storyId={storyId} />;
}
