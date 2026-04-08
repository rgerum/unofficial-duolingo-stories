"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumbs } from "@/app/editor/_components/breadcrumbs";
import { EditorHeaderBreadcrumbs } from "@/app/editor/_components/header_context";
import TtsEdit from "@/app/editor/language/[language]/tts_edit/tts_edit";
import type { DetailedCourseProps } from "@/app/editor/(course)/types";
import type {
  CourseStudType,
  LanguageType,
  SpeakersType,
} from "@/app/editor/language/[language]/types";

export default function CourseVoicesEditPageClient({
  courseId,
}: {
  courseId: string;
}) {
  const course = useQuery(api.editorRead.getEditorCourseByIdentifier, {
    identifier: courseId,
  }) as DetailedCourseProps | null | undefined;
  const learningLanguage = useQuery(
    api.editorRead.getEditorLanguageByLegacyId,
    course ? { legacyLanguageId: course.learning_language } : "skip",
  ) as LanguageType | null | undefined;
  const fromLanguage = useQuery(
    api.editorRead.getEditorLanguageByLegacyId,
    course ? { legacyLanguageId: course.from_language } : "skip",
  ) as LanguageType | null | undefined;
  const speakers = useQuery(
    api.editorRead.getEditorSpeakersByLanguageLegacyId,
    learningLanguage ? { languageLegacyId: learningLanguage.id } : "skip",
  ) as SpeakersType[] | undefined;

  if (course === undefined) return <Spinner />;
  if (
    learningLanguage === undefined ||
    fromLanguage === undefined ||
    speakers === undefined
  ) {
    return (
      <>
        {course ? (
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
                {
                  type: "Voices",
                  href: `/editor/course/${course.short}/voices`,
                },
                { type: "sep" },
                { type: "Edit" },
              ]}
            />
          </EditorHeaderBreadcrumbs>
        ) : null}
        <Spinner />
      </>
    );
  }

  if (!course || !learningLanguage) {
    return <p>Course not found.</p>;
  }

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
            { type: "Voices", href: `/editor/course/${course.short}/voices` },
            { type: "sep" },
            { type: "Edit" },
          ]}
        />
      </EditorHeaderBreadcrumbs>
      <TtsEdit
        language={learningLanguage}
        language2={fromLanguage ?? undefined}
        speakers={speakers ?? []}
        course={
          {
            learning_language: course.learning_language,
            from_language: course.from_language,
            short: course.short ?? courseId,
          } as CourseStudType
        }
        renderHeader={false}
      />
    </>
  );
}
