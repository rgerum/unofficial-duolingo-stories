"use client";
import React from "react";

import { useRouter } from "next/navigation";
import StoryProgress from "@/components/StoryProgress";
import useSearchParamsState from "@/hooks/use-search-params-state.hook";
import { StoryData } from "@/app/(stories)/story/[story_id]/getStory";

export default function StoryWrapper({
  story,
  storyFinishedIndexUpdate,
  show_title_page,
}: {
  story: StoryData;
  storyFinishedIndexUpdate: () => Promise<{ message: string }>;
  show_title_page: boolean;
}) {
  const router = useRouter();
  const [highlight_name, setHighlightName] = useSearchParamsState(
    "highlight_name",
    [],
  );
  const [hideNonHighlighted, setHideNonHighlighted] = useSearchParamsState(
    "hide_non_highlighted",
    false,
  );
  console.log("highlight_nameX", highlight_name);
  return (
    <>
      <StoryProgress
        story={story}
        settings={{
          hide_questions: true,
          show_all: true,
          show_names: true,
          rtl: story.learning_language_rtl,
          highlight_name: highlight_name,
          hideNonHighlighted: hideNonHighlighted,
          setHighlightName: setHighlightName,
          setHideNonHighlighted: setHideNonHighlighted,
          id: story.id,
          show_title_page: show_title_page,
        }}
        onEnd={storyFinishedIndexUpdate}
      />
    </>
  );
}
