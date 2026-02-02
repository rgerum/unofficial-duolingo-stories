"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { StoryData } from "@/app/(stories)/story/[story_id]/getStory_convex";
import StoryProgress from "@/components/StoryProgress";

export default function StoryWrapper({ story }: { story: StoryData }) {
  const hide_questions = useSearchParams().get("hide_questions");

  return (
    <>
      <StoryProgress
        story={story}
        onEnd={() => {}}
        settings={{
          hide_questions: !!hide_questions,
          show_all: true,
          show_names: false,
          rtl: story.learning_language_rtl,
          highlight_name: [],
          hideNonHighlighted: false,
          setHighlightName: (_name: string[]) => {},
          setHideNonHighlighted: (_value: React.SetStateAction<boolean>) => {},
          id: story.id,
          show_title_page: false,
        }}
      />
    </>
  );
}
