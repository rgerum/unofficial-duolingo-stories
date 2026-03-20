"use client";
import React from "react";

import { useRouter } from "next/navigation";
import StoryProgress from "@/components/StoryProgress";
import { useNavigationMode } from "@/components/NavigationModeProvider";
import { StoryData } from "@/app/(stories)/story/[story_id]/getStory";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";
import {
  getCurrentPostHogUser,
  identifyPostHogUser,
  type PostHogUser,
} from "@/lib/posthog-user";

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
  const trackedStoryStart = React.useRef(false);
  const { data: session } = authClient.useSession();
  const sessionUser = (session?.user ?? null) as PostHogUser | null;

  const captureStoryEvent = React.useCallback(
    async (eventName: "story_started" | "story_completed") => {
      if (!identifyPostHogUser(sessionUser)) {
        identifyPostHogUser(await getCurrentPostHogUser());
      }
      posthog.capture(eventName, {
        story_id: story.id,
        story_name: story.from_language_name,
        course_id: story.course_id,
        course_short: story.course_short,
        learning_language: story.learning_language_long,
      });
    },
    [
      sessionUser?.id,
      sessionUser?.email,
      sessionUser?.name,
      sessionUser?.username,
      story.id,
      story.from_language_name,
      story.course_id,
      story.course_short,
      story.learning_language_long,
    ],
  );

  // Track story started on component mount
  React.useEffect(() => {
    if (trackedStoryStart.current) return;
    trackedStoryStart.current = true;
    void captureStoryEvent("story_started");
  }, [captureStoryEvent]);

  async function onEnd() {
    // Track story completed
    await captureStoryEvent("story_completed");
    await storyFinishedIndexUpdate();
    const setHash = story.set_id > 0 ? `#${story.set_id}` : "";
    router.push(`/${story.course_short}${setHash}`);
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
