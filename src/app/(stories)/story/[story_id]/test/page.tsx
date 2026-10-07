import React from "react";
import StoryWrapper from "./story_wrapper";
import { notFound } from "next/navigation";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const story_id = parseInt((await params).story_id);
  if (!Number.isFinite(story_id)) notFound();

  return <StoryWrapper storyId={story_id} />;
}
