"use client";
import React from "react";

import { useRouter, useSearchParams } from "next/navigation";
import StoryProgress from "../../../../components/StoryProgress";

export default async function StoryWrapper({
  story,
  storyFinishedIndexUpdate,
}) {
  const router = useRouter();

  const highlight_name = useSearchParams().get("highlight_name");

  return (
    <>
      <StoryProgress
        story={story}
        router={router}
        settings={{
          hide_questions: false,
          show_all: true,
          show_names: true,
          highlight_name: highlight_name,
          id: story.id,
        }}
        storyFinishedIndexUpdate={storyFinishedIndexUpdate}
      />
    </>
  );
}
