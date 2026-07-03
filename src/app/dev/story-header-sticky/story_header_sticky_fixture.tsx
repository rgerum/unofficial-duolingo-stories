"use client";

import React from "react";
import StoryProgress from "@/components/StoryProgress";
import type { StoryData } from "@/app/(stories)/story/[story_id]/getStory";

export default function StoryHeaderStickyFixture({
  story,
}: {
  story: StoryData;
}) {
  return (
    <StoryProgress
      story={story}
      onEnd={() => {}}
      settings={{
        hide_questions: false,
        show_all: false,
        show_names: false,
        rtl: story.learning_language_rtl,
        highlight_name: [],
        hideNonHighlighted: false,
        setHighlightName: () => {},
        setHideNonHighlighted: () => {},
        show_hints: true,
        setShowHints: () => {},
        show_audio: false,
        setShowAudio: () => {},
        id: story.id,
        show_title_page: false,
      }}
    />
  );
}
