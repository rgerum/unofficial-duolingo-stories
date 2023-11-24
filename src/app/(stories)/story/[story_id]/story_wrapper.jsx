"use client";
import React from "react";

import Story from "components/story/story";
import { useRouter } from "next/navigation";
import get_localisation_func from "../../../../lib/get_localisation_func";

export default async function StoryWrapper({
  story,
  storyFinishedIndexUpdate,
  localization,
}) {
  let router = useRouter();

  return (
    <>
      <Story
        story={story}
        router={router}
        localization={get_localisation_func(localization)}
        storyFinishedIndexUpdate={storyFinishedIndexUpdate}
      />
    </>
  );
}
