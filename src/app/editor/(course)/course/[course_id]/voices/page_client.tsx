"use client";

import React from "react";
import { AudioLinesIcon, SlidersHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumbs } from "@/app/editor/_components/breadcrumbs";
import {
  EditorHeaderActions,
  EditorHeaderBreadcrumbs,
} from "@/app/editor/_components/header_context";
import EditorButton from "@/app/editor/editor_button";
import MobileEditorHeader from "@/app/editor/_components/mobile_editor_header";
import CourseMobileHeaderIllustration from "@/app/editor/_components/course_mobile_header_illustration";
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

  if (course === undefined) {
    return (
      <>
        <MobileEditorHeader
          backHref={`/editor/course/${courseId}`}
          backLabel="Back to course"
          icon={
            <span className="grid w-8 shrink-0 place-items-center">
              <span className="size-6 animate-pulse rounded-full bg-[var(--header-border)]" />
            </span>
          }
          title="Character voices"
          subtitle="Loading course…"
        />
        <Spinner />
      </>
    );
  }
  if (!course) {
    return (
      <>
        <MobileEditorHeader
          backHref="/editor"
          backLabel="Back to editor"
          icon={<CourseVoicesIcon />}
          title="Character voices"
          subtitle="Course not found"
        />
        <p className="max-[975px]:p-4">Course not found.</p>
      </>
    );
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
      <MobileEditorHeader
        backHref={`/editor/course/${course.short}`}
        backLabel="Back to course"
        icon={
          <CourseMobileHeaderIllustration
            learningLanguageId={course.learningLanguageId}
            fromLanguageId={course.fromLanguageId}
          />
        }
        title="Character voices"
        subtitle={course.learning_language_name}
      >
        <Link
          href={`/editor/course/${course.short}/voices/edit`}
          aria-label="Pronunciation rules"
          className="grid size-11 shrink-0 place-items-center rounded-xl text-[var(--text-color)] no-underline transition-colors hover:bg-[var(--header-border)]"
        >
          <SlidersHorizontalIcon className="size-5" />
        </Link>
      </MobileEditorHeader>
      <LanguageEditor
        identifier={courseId}
        renderHeader={false}
        mobileCourseLayout
      />
    </>
  );
}

function CourseVoicesIcon() {
  return (
    <span className="grid w-8 shrink-0 place-items-center">
      <AudioLinesIcon className="size-5" aria-hidden="true" />
    </span>
  );
}
