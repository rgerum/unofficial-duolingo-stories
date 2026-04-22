"use client";

import React from "react";
import { useConvex, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Spinner } from "@/components/ui/spinner";
import EditorV2 from "./v2/editor_v2";
import { StoryEditorHeaderLoading } from "./header";
import type { Avatar, StoryEditorPageData } from "./types";
import type {
  DetailedCourseProps,
  StoryListDataProps,
} from "@/app/editor/(course)/types";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { EditorHeaderBreadcrumbs } from "../../_components/header_context";

export default function StoryEditorPageClient({
  storyId,
  courseId,
  initialFocusLine,
  initialBulkAudioOpen,
}: {
  storyId: number;
  courseId?: string;
  initialFocusLine?: number;
  initialBulkAudioOpen?: boolean;
}) {
  const convex = useConvex();
  const data = useQuery(api.editorRead.getEditorStoryPageData, {
    storyId,
  }) as StoryEditorPageData | null | undefined;
  const effectiveCourseId =
    data?.story_data.short && data.story_data.short !== courseId
      ? data.story_data.short
      : courseId;
  const course = useQuery(
    api.editorRead.getEditorCourseByIdentifier,
    effectiveCourseId ? { identifier: effectiveCourseId } : "skip",
  ) as DetailedCourseProps | null | undefined;
  const stories = useQuery(
    api.editorRead.getEditorStoriesByCourseLegacyId,
    effectiveCourseId ? { identifier: effectiveCourseId } : "skip",
  ) as StoryListDataProps[] | undefined;
  const avatarRows = useQuery(
    api.editorRead.getEditorAvatarNamesByLanguageLegacyId,
    data ? { languageLegacyId: data.story_data.learning_language } : "skip",
  );
  const storyIndex =
    stories?.findIndex((story) => story.id === data?.story_data.id) ?? -1;
  const previousStory = storyIndex > 0 ? stories?.[storyIndex - 1] : null;
  const nextStory =
    storyIndex >= 0 && stories && storyIndex < stories.length - 1
      ? stories[storyIndex + 1]
      : null;

  React.useEffect(() => {
    if (!data || !course) return;

    const storyIdsToPrewarm = [previousStory?.id, nextStory?.id].filter(
      (candidate): candidate is number => typeof candidate === "number",
    );
    if (storyIdsToPrewarm.length === 0) return;

    const prewarm = () => {
      for (const adjacentStoryId of storyIdsToPrewarm) {
        convex.prewarmQuery({
          query: api.editorRead.getEditorStoryPageData,
          args: { storyId: adjacentStoryId },
          extendSubscriptionFor: 15_000,
        });
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleCallbackId = window.requestIdleCallback(() => {
        prewarm();
      });
      return () => window.cancelIdleCallback(idleCallbackId);
    }

    const timeoutId = window.setTimeout(prewarm, 250);
    return () => window.clearTimeout(timeoutId);
  }, [convex, data, course, nextStory?.id, previousStory?.id]);

  if (data === undefined || !effectiveCourseId || course === undefined) {
    return (
      <>
        {course ? (
          <EditorHeaderBreadcrumbs>
            <Breadcrumbs
              path={[
                { type: "Editor", href: `/editor` },
                { type: "sep", href: "#" },
                {
                  type: "course",
                  lang1: {
                    languageId: course.learningLanguageId,
                    name: course.learning_language_name,
                  },
                  lang2: {
                    languageId: course.fromLanguageId,
                    name: course.from_language_name,
                  },
                  href: `/editor/course/${course.short}`,
                },
              ]}
            />
          </EditorHeaderBreadcrumbs>
        ) : null}
        <StoryEditorHeaderLoading />
        <Spinner />
      </>
    );
  }
  if (!data) return <p>Story not found.</p>;
  if (!course) return <p>Course not found.</p>;

  const avatarNames: Record<number, Avatar> = {};
  for (const avatar of (avatarRows ?? []) as Avatar[]) {
    avatarNames[avatar.avatar_id] = avatar;
  }
  const coursePathId = course.short ?? effectiveCourseId;

  return (
    <>
      <EditorHeaderBreadcrumbs>
        <Breadcrumbs
          path={[
            { type: "Editor", href: `/editor` },
            { type: "sep", href: "#" },
            {
              type: "course",
              lang1: {
                languageId: course.learningLanguageId,
                name: course.learning_language_name,
              },
              lang2: {
                languageId: course.fromLanguageId,
                name: course.from_language_name,
              },
              href: `/editor/course/${course.short}`,
            },
            { type: "sep", href: "#" },
            { type: "story", href: `#`, data: data.story_data },
          ]}
        />
      </EditorHeaderBreadcrumbs>
      <EditorV2
        isAdmin={data.isAdmin}
        story_data={data.story_data}
        avatar_names={avatarNames}
        initialFocusLine={initialFocusLine}
        initialBulkAudioOpen={initialBulkAudioOpen}
        story_navigation={{
          previousStory: previousStory
            ? {
                href: `/editor/course/${coursePathId}/story/${previousStory.id}`,
                name: previousStory.name,
              }
            : null,
          nextStory: nextStory
            ? {
                href: `/editor/course/${coursePathId}/story/${nextStory.id}`,
                name: nextStory.name,
              }
            : null,
        }}
      />
    </>
  );
}
