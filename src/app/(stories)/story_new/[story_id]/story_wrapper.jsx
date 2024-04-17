"use client";
import React from "react";

import { useRouter } from "next/navigation";
import StoryProgress from "../../../../components/StoryProgress";
import useSearchParamsState from "../../../../hooks/use-search-params-state.hook";

export default function StoryWrapper({ story, storyFinishedIndexUpdate }) {
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
          show_all: true,
          show_names: true,
          highlight_name: highlight_name,
          hideNonHighlighted: hideNonHighlighted,
          setHighlightName: setHighlightName,
          setHideNonHighlighted: setHideNonHighlighted,
          id: story.id,
        }}
        storyFinishedIndexUpdate={storyFinishedIndexUpdate}
      />
    </>
  );
}