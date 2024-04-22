"use client";
import React from "react";

import { useRouter } from "next/navigation";
import StoryProgress from "../../../../components/StoryProgress";
import useSearchParamsState from "../../../../hooks/use-search-params-state.hook";

export default function StoryWrapper({
  story,
  storyFinishedIndexUpdate,
  show_title_page,
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

  return (
    <>
      <StoryProgress
        story={story}
        router={router}
        settings={{
          hide_questions: false,
          show_all: false,
          show_names: false,
          rtl: story.learning_language_rtl,
          highlight_name: highlight_name,
          hideNonHighlighted: hideNonHighlighted,
          setHighlightName: setHighlightName,
          setHideNonHighlighted: setHideNonHighlighted,
          id: story.id,
          show_title_page: show_title_page,
        }}
        storyFinishedIndexUpdate={storyFinishedIndexUpdate}
      />
    </>
  );
}
