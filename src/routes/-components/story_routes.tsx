"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { LocalisationProviderInner } from "@/components/LocalisationProvider/LocalisationProviderContext";
import StoryWrapper from "@/app/(stories)/story/[story_id]/story_wrapper";
import StoryAutoPlayWrapper from "@/app/(stories)/story/[story_id]/auto_play/story_wrapper";
import StoryScriptWrapper from "@/app/(stories)/story/[story_id]/script/story_wrapper";
import StoryTestWrapper from "@/app/(stories)/story/[story_id]/test/story_wrapper";

function useLocalisationData(legacyLanguageId: number | undefined) {
  const rows = useQuery(
    api.localization.getLocalizationByLegacyLanguageId,
    legacyLanguageId ? { legacyLanguageId } : "skip",
  );

  return React.useMemo(() => {
    const data: Record<string, string> = {};
    for (const row of rows ?? []) {
      data[row.tag] = row.text;
    }
    return data;
  }, [rows]);
}

function LoadingState() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] items-center justify-center px-6 py-10">
      Loading story...
    </main>
  );
}

function NotFoundState() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] items-center justify-center px-6 py-10">
      Story not found.
    </main>
  );
}

export function StoryPage({ storyId }: { storyId: number }) {
  const story = useQuery(api.storyRead.getStoryByLegacyId, { storyId });
  const recordStoryDone = useMutation(api.storyDone.recordStoryDone);
  const localisation = useLocalisationData(story?.from_language_id);

  const markDone = React.useCallback(async () => {
    await recordStoryDone({
      legacyStoryId: storyId,
      time: Date.now(),
    });

    return {
      message: "done",
      story_id: storyId,
    };
  }, [recordStoryDone, storyId]);

  if (story === undefined) return <LoadingState />;
  if (story === null) return <NotFoundState />;

  return (
    <LocalisationProviderInner data={localisation}>
      <StoryWrapper story={story} storyFinishedIndexUpdate={markDone} />
    </LocalisationProviderInner>
  );
}

export function StoryAutoPlayPage({ storyId }: { storyId: number }) {
  return <StoryAutoPlayWrapper storyId={storyId} />;
}

export function StoryScriptPage({ storyId }: { storyId: number }) {
  const story = useQuery(api.storyRead.getStoryByLegacyId, { storyId });
  const localisation = useLocalisationData(story?.from_language_id);

  const onComplete = React.useCallback(async () => ({ message: "done" }), []);

  if (story === undefined) return <LoadingState />;
  if (story === null) return <NotFoundState />;

  return (
    <LocalisationProviderInner data={localisation}>
      <StoryScriptWrapper
        story={story}
        storyFinishedIndexUpdate={onComplete}
        show_title_page={false}
      />
    </LocalisationProviderInner>
  );
}

export function StoryTestPage({ storyId }: { storyId: number }) {
  return <StoryTestWrapper storyId={storyId} />;
}
