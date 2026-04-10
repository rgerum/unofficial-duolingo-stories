"use client";
import React from "react";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import StoryProgress from "@/components/StoryProgress";
import { useNavigationMode } from "@/components/NavigationModeProvider";
import { StoryData } from "@/app/(stories)/story/[story_id]/getStory";
import { api } from "@convex/_generated/api";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";
import {
  getCurrentPostHogUser,
  identifyPostHogUser,
  type PostHogUser,
} from "@/lib/posthog-user";

const STORY_END_NEXT_FLAG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_STORY_END_NEXT_FLAG_KEY ?? "";
const HAS_POSTHOG = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

export default function StoryWrapper({
  story,
  editHrefBase,
  initialFocusLine,
  storyFinishedIndexUpdate,
}: {
  story: StoryData;
  editHrefBase?: string;
  initialFocusLine?: number;
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
  const completionInFlight = React.useRef(false);
  const [isNextStoryEnabled, setIsNextStoryEnabled] = React.useState(
    !HAS_POSTHOG || STORY_END_NEXT_FLAG_KEY.length === 0,
  );
  const { data: session } = authClient.useSession();
  const sessionUser = (session?.user ?? null) as PostHogUser | null;
  const nextStep = useQuery(
    api.storyDone.getNextStoryForCurrentUserInCourse,
    sessionUser?.id
      ? {
          courseShort: story.course_short,
          currentStoryId: story.id,
        }
      : "skip",
  );
  const showNextStoryAction =
    isNextStoryEnabled && Boolean(nextStep?.nextStoryId);
  const nextStoryPreview = useQuery(
    api.storyRead.getStoryPreviewByLegacyId,
    showNextStoryAction && nextStep?.nextStoryId
      ? { storyId: nextStep.nextStoryId }
      : "skip",
  );

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
      sessionUser,
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

  React.useEffect(() => {
    if (!HAS_POSTHOG || STORY_END_NEXT_FLAG_KEY.length === 0) {
      setIsNextStoryEnabled(true);
      return;
    }

    const update = () => {
      setIsNextStoryEnabled(
        posthog.isFeatureEnabled(STORY_END_NEXT_FLAG_KEY) === true,
      );
    };

    update();
    const unsubscribe = posthog.onFeatureFlags(update);

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const finishedLabel = showNextStoryAction
    ? "Next story"
    : nextStep && !nextStep.nextStoryId
      ? "Review stories"
      : undefined;

  async function completeStoryOnce() {
    if (completionInFlight.current) return false;
    completionInFlight.current = true;
    let succeeded = false;

    try {
      await captureStoryEvent("story_completed");
      await storyFinishedIndexUpdate();
      succeeded = true;
      return true;
    } finally {
      if (!succeeded) {
        completionInFlight.current = false;
      }
    }
  }

  async function goToOverview() {
    const didComplete = await completeStoryOnce();
    if (!didComplete) return;
    navigateToOverview();
  }

  function navigateToOverview() {
    const setHash = story.set_id > 0 ? `#${story.set_id}` : "";
    router.push(`/${story.course_short}${setHash}`);
  }

  async function onEnd() {
    const didComplete = await completeStoryOnce();
    if (!didComplete) return;
    if (showNextStoryAction && nextStep?.nextStoryId) {
      posthog.capture("story_end_next_clicked", {
        language: story.learning_language_long,
        story_id: nextStep.nextStoryId,
        completed_count: nextStep.completedCount,
        total_count: nextStep.totalCount,
      });
      router.push(`/story/${nextStep.nextStoryId}`);
      return;
    }
    navigateToOverview();
  }

  const shouldShowDefaultFinishedButton =
    !sessionUser?.id || nextStep === undefined || nextStep === null;
  const showFinishedPrimaryAction =
    shouldShowDefaultFinishedButton || Boolean(finishedLabel);

  return (
    <>
      <StoryProgress
        key={`${story.id}:${initialFocusLine ?? "start"}:${mode}`}
        story={story}
        editHrefBase={editHrefBase}
        initialFocusLine={initialFocusLine}
        settings={{
          hide_questions: false,
          show_all: false,
          show_names: false,
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
          show_title_page: mode === "hard",
        }}
        onEnd={onEnd}
        onBackToOverview={goToOverview}
        finishedLabel={finishedLabel}
        nextStoryPreview={nextStoryPreview}
        showFinishedPrimaryAction={showFinishedPrimaryAction}
      />
    </>
  );
}
