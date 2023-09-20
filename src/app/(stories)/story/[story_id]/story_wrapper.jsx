"use client";
import React from "react";

import Story from "components/story/story";
import { useRouter } from "next/navigation";

export async function setStoryDone(id) {
  let res = await fetch(`/story/${id}/done`, { credentials: "include" });
  let answer = res.json();
  if (answer?.message === "done") return true;
  return res;
}

export default async function StoryWrapper({ story }) {
  let storyFinishedIndexUpdate = async () => {
    await setStoryDone(story.id);
  };
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
