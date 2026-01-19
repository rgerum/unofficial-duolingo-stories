"use client";
import React from "react";

import { useRouter } from "next/navigation";
import StoryProgress from "@/components/StoryProgress";
import { useNavigationMode } from "@/components/NavigationModeProvider";
import { StoryData } from "@/app/(stories)/story/[story_id]/getStory";

export default function StoryWrapper({
  story,
  storyFinishedIndexUpdate,
}: {
  story: StoryData;
  storyFinishedIndexUpdate: () => Promise<
    | {
        message: string;
        story_id: number;
        course_id?: undefined;
      }
    | {
        message: string;
        story_id: number;
        course_id: number;
      }
  >;
}) {
  const mode = useNavigationMode();
  const router = useRouter();
  const [highlight_name, setHighlightName] = React.useState<string[]>([]);
  const [hideNonHighlighted, setHideNonHighlighted] = React.useState(false);

  async function onEnd() {
    await storyFinishedIndexUpdate();
    router.push(`/${story.course_short}`);
  }

  return (
    <>
      <StoryProgress
        story={story}
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
