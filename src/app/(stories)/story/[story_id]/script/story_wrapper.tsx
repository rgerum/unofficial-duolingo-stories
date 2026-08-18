"use client";
import React from "react";
import { useSearchParams } from "next/navigation";

import StoryProgress from "@/components/StoryProgress";
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
  const searchParams = useSearchParams();
  const [highlight_name, setHighlightName] = React.useState<string[]>(() =>
    searchParams.getAll("highlight"),
  );
  const [hideNonHighlighted, setHideNonHighlighted] = React.useState(
    searchParams.get("hide") === "1",
  );

  // Mirror the selection into the URL so the current view can be shared.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete("highlight");
    for (const name of highlight_name) params.append("highlight", name);
    if (hideNonHighlighted) params.set("hide", "1");
    else params.delete("hide");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `?${query}` : window.location.pathname,
    );
  }, [highlight_name, hideNonHighlighted]);
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
          show_hints: true,
          setShowHints: () => {},
          show_audio: true,
          setShowAudio: () => {},
          id: story.id,
          show_title_page: show_title_page,
        }}
        onEnd={storyFinishedIndexUpdate}
      />
    </>
  );
}
