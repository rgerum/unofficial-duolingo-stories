"use client";
import React from "react";

import Story from "components/story/story";
import { useRouter } from "next/navigation";
import styles from "components/story/story.module.css";

export default function StoryWrapper({ story }) {
  const navigate = useRouter().push;

  return (
    <>
      <div className={styles.main}>
        <Story story={story} auto_play={true} navigate={navigate} />
      </div>
    </>
  );
}
