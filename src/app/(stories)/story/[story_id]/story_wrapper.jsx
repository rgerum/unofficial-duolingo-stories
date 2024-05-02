"use client";
import React from "react";

import { useRouter } from "next/navigation";
import StoryProgress from "../../../../components/StoryProgress";
import useSearchParamsState from "../../../../hooks/use-search-params-state.hook";
import { useNavigationMode } from "../../../../components/NavigationModeProvider";

export default function StoryWrapper({ story, storyFinishedIndexUpdate }) {
  const mode = useNavigationMode();
  const router = useRouter();
  const [highlight_name, setHighlightName] = useSearchParamsState(
    "highlight_name",
    [],
  );
  const [hideNonHighlighted, setHideNonHighlighted] = useSearchParamsState(
    "hide_non_highlighted",
    false,
  );

  async function onEnd() {
    await storyFinishedIndexUpdate();
    router.push(`/${story.course_short}`);
  }

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
          show_title_page: mode === "hard",
        }}
        onEnd={onEnd}
      />
    </>
  );
}
