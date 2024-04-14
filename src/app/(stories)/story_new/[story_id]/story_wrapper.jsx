"use client";
import React from "react";

import { useRouter } from "next/navigation";
import get_localisation_func from "../../../../lib/get_localisation_func";
import StoryProgress from "../../../../components/StoryProgress";
import LocalisationProvider from "../../../../components/LocalisationProvider";

export default async function StoryWrapper({
  story,
  storyFinishedIndexUpdate,
  localization,
}) {
  const router = useRouter();

  return (
    <>
      <StoryProgress
        story={story}
        router={router}
        localization={get_localisation_func(localization)}
        storyFinishedIndexUpdate={storyFinishedIndexUpdate}
      />
    </>
  );
}
