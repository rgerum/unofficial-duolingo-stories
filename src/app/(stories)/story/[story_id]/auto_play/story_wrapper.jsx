"use client";
import React from "react";

import Story from "@/components/story/story";
import { useRouter } from "next/navigation";
import styles from "@/components/story/story.module.css";
import get_localisation_func from "@/lib/get_localisation_func";

export default function StoryWrapper({ story, localization }) {
  const router = useRouter();

  return (
    <>
      <div className={styles.main}>
        <Story
          story={story}
          auto_play={true}
          router={router}
          localization={get_localisation_func(localization)}
        />
      </div>
    </>
  );
}
