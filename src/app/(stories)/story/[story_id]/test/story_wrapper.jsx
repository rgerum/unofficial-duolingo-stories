"use client";
import React from "react";

import Story from "@/components/story/story";
import { useRouter } from "next/navigation";
import { EditorContext } from "@/components/story/story";
import styles from "@/components/story/story.module.css";
import { useSearchParams } from "next/navigation";

export default function StoryWrapper({ story }) {
  const navigate = useRouter().push;

  const hide_questions = useSearchParams().get("hide_questions");

  return (
    <>
      <div className={styles.main}>
        <EditorContext.Provider value={{ lineno: 3 }}>
          <Story
            story={story}
            editor={{ lineno: 3 }}
            navigate={navigate}
            hide_questions={hide_questions}
          />
        </EditorContext.Provider>
      </div>
    </>
  );
}
