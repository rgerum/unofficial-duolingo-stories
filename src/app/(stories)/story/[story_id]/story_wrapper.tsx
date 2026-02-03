"use client";
import React from "react";

import { useRouter } from "next/navigation";
import StoryProgress from "@/components/StoryProgress";
import { useNavigationMode } from "@/components/NavigationModeProvider";
import { StoryData } from "@/app/(stories)/story/[story_id]/getStory";
import posthog from "posthog-js";

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

  // Track story started on component mount
  React.useEffect(() => {
    posthog.capture("story_started", {
      story_id: story.id,
      story_name: story.from_language_name,
      course_id: story.course_id,
      course_short: story.course_short,
      learning_language: story.learning_language_long,
    });
  }, [
    story.id,
    story.from_language_name,
    story.course_id,
    story.course_short,
    story.learning_language_long,
  ]);

  async function onEnd() {
    // Track story completed
    posthog.capture("story_completed", {
      story_id: story.id,
      story_name: story.from_language_name,
      course_id: story.course_id,
      course_short: story.course_short,
      learning_language: story.learning_language_long,
    });
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
