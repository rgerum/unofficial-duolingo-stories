"use client";
import React from "react";

import { useRouter } from "next/navigation";
import StoryProgress from "../../../../components/StoryProgress";

export default async function StoryWrapper({
  story,
  storyFinishedIndexUpdate,
}) {
  const router = useRouter();

  return (
    <>
      <StoryProgress
        story={story}
        router={router}
        settings={{ hide_questions: false, show_all: true, show_names: true }}
        storyFinishedIndexUpdate={storyFinishedIndexUpdate}
      />
    </>
  );
}
