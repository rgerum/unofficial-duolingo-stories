"use client";
import React from "react";

import Story from "@/components/story/story";
import styles from "@/components/story/story.module.css";
import get_localisation_func from "@/lib/get_localisation_func";
import { StoryData } from "@/app/(stories)/story/[story_id]/getStory";

export default function StoryWrapper({
  story,
  localization,
}: {
  story: StoryData;
  localization: Record<string, string>;
}) {
  return (
    <>
      <div className={styles.main}>
        <Story
          story={story}
          auto_play={true}
          localization={get_localisation_func(localization)}
        />
      </div>
    </>
  );
}
