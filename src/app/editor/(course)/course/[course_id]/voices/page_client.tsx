"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumbs } from "@/app/editor/_components/breadcrumbs";
import {
  EditorHeaderActions,
  EditorHeaderBreadcrumbs,
} from "@/app/editor/_components/header_context";
import EditorButton from "@/app/editor/editor_button";
import LanguageEditor from "@/app/editor/language/[language]/language_editor";
import type { DetailedCourseProps } from "@/app/editor/(course)/types";

export default function CourseVoicesPageClient({
  courseId,
}: {
  courseId: string;
}) {
  const course = useQuery(api.editorRead.getEditorCourseByIdentifier, {
    identifier: courseId,
  }) as DetailedCourseProps | null | undefined;

  if (course === undefined) return <Spinner />;
  if (!course) return <p>Course not found.</p>;

  return (
    <>
      <EditorHeaderBreadcrumbs>
        <Breadcrumbs
          path={[
            { type: "Editor", href: `/editor` },
            { type: "sep" },
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
            { type: "sep" },
            { type: "Voices" },
          ]}
        />
      </EditorHeaderBreadcrumbs>
      <EditorHeaderActions>
        <EditorButton
          id="button_edit"
          href={`/editor/course/${course.short}/voices/edit`}
          data-cy="button_edit"
          img={"import.svg"}
          text={"Edit"}
        />
      </EditorHeaderActions>
      <LanguageEditor identifier={courseId} renderHeader={false} />
    </>
  );
}
