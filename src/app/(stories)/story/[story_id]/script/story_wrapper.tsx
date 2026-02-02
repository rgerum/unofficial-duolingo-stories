"use client";
import React from "react";

import StoryProgress from "@/components/StoryProgress";
import { StoryData } from "@/app/(stories)/story/[story_id]/getStory_convex";

export default function StoryWrapper({
  story,
  storyFinishedIndexUpdate,
  show_title_page,
}: {
  story: StoryData;
  storyFinishedIndexUpdate: () => Promise<{ message: string }>;
  show_title_page: boolean;
}) {
  const [highlight_name, setHighlightName] = React.useState<string[]>([]);
  const [hideNonHighlighted, setHideNonHighlighted] = React.useState(false);
  //console.log("highlight_nameX", highlight_name);
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
