"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Spinner } from "@/components/ui/spinner";
import EditorV2 from "./v2/editor_v2";
import type { Avatar, StoryEditorPageData } from "./types";
import type { DetailedCourseProps } from "@/app/editor/(course)/types";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { EditorHeaderBreadcrumbs } from "../../_components/header_context";

export default function StoryEditorPageClient({
  storyId,
  courseId,
}: {
  storyId: number;
  courseId?: string;
}) {
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
  const avatarRows = useQuery(
    api.editorRead.getEditorAvatarNamesByLanguageLegacyId,
    data ? { languageLegacyId: data.story_data.learning_language } : "skip",
  );

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
        course_data={course}
      />
    </>
  );
}
