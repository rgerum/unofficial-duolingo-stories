"use client";
import React from "react";

import StoryAutoPlay from "@/components/StoryAutoPlay";
import { StoryData } from "@/app/(stories)/story/[story_id]/getStory";

export default function StoryWrapper({
  story,
}: {
  story: StoryData;
  localization: Record<string, string>;
}) {
  return <StoryAutoPlay story={story} />;
}
