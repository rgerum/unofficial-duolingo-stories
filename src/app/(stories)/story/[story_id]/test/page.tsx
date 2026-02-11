import React from "react";
import StoryWrapper from "./story_wrapper";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const story_id = parseInt((await params).story_id);
  if (!Number.isFinite(story_id)) notFound();

  return <StoryWrapper storyId={story_id} />;
}
