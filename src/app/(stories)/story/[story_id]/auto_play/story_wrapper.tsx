"use client";
import React from "react";

import StoryAutoPlay from "@/components/StoryAutoPlay";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export default function StoryWrapper({
  storyId,
}: {
  storyId: number;
}) {
  const story = useQuery(api.storyRead.getStoryByLegacyId, { storyId });
  if (story === undefined) return null;
  if (story === null) return <p>Story not found.</p>;

  return <StoryAutoPlay story={story} />;
}
