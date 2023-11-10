"use client";
import React from "react";

import Story from "components/story/story";
import { useRouter } from "next/navigation";

export default async function StoryWrapper({
  story,
  storyFinishedIndexUpdate,
}) {
  let router = useRouter();

  return (
    <>
      <Story
        story={story}
        router={router}
        storyFinishedIndexUpdate={storyFinishedIndexUpdate}
      />
    </>
  );
}
