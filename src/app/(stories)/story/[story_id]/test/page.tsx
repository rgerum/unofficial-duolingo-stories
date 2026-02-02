import React from "react";
import { get_story } from "../getStory_convex";
import StoryWrapper from "./story_wrapper";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const story_id = parseInt((await params).story_id);
  const story = await get_story(story_id);
  if (!story) notFound();

  return <StoryWrapper story={story} />;
}
