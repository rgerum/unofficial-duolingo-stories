"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import StoryProgress from "@/components/StoryProgress";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export default function StoryWrapper({ storyId }: { storyId: number }) {
  const hide_questions = useSearchParams().get("hide_questions");
  const story = useQuery(api.storyRead.getStoryByLegacyId, { storyId });
  if (story === undefined) return null;
  if (story === null) return <p>Story not found.</p>;

  return (
    <>
      <StoryProgress
        story={story}
        onEnd={() => {}}
        settings={{
          hide_questions: !!hide_questions,
          show_all: true,
          show_names: false,
          rtl: story.learning_language_rtl,
          highlight_name: [],
          hideNonHighlighted: false,
          setHighlightName: (_name: string[]) => {},
          setHideNonHighlighted: (_value: React.SetStateAction<boolean>) => {},
          id: story.id,
          show_title_page: false,
        }}
      />
    </>
  );
}
