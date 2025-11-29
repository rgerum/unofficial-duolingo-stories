"use client";
import React from "react";

import Story from "@/components/story/story";
import { useRouter } from "next/navigation";
import { EditorContext } from "@/components/story/story";
import styles from "@/components/story/story.module.css";
import { useSearchParams } from "next/navigation";
import { StoryData } from "@/app/(stories)/story/[story_id]/getStory";

export default function StoryWrapper({ story }: { story: StoryData }) {
  const navigate = useRouter().push;

  const hide_questions = useSearchParams().get("hide_questions");

  return (
    <>
      <div className={styles.main}>
        <Story
          story={story}
          //editor={{ lineno: 3 }}
          hide_questions={!!hide_questions}
        />
      </div>
    </>
  );
}
