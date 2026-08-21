"use client";

import { BarChart3Icon } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Breadcrumbs } from "@/app/editor/_components/breadcrumbs";
import {
  EditorHeaderActions,
  EditorHeaderBreadcrumbs,
} from "@/app/editor/_components/header_context";
import MobileEditorHeader from "@/app/editor/_components/mobile_editor_header";
import CourseStats from "@/app/editor/(course)/course_stats";
import type { DetailedCourseProps } from "@/app/editor/(course)/types";
import { Spinner } from "@/components/ui/spinner";
import LanguageFlag from "@/components/ui/language-flag";

export default function CourseStatsPageClient({
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
          icon={<CourseStatsIcon />}
          title="Course stats"
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
          icon={<CourseStatsIcon />}
          title="Course stats"
          subtitle="Course not found"
        />
        <p className="p-4">Course not found.</p>
      </>
    );
  }

  return (
    <>
      <EditorHeaderBreadcrumbs>
        <Breadcrumbs
          path={[
            { type: "Editor", href: "/editor" },
            { type: "sep" },
            {
              type: "course",
              href: `/editor/course/${course.short}`,
              lang1: {
                languageId: course.learningLanguageId,
                name: course.learning_language_name,
              },
              lang2: {
                languageId: course.fromLanguageId,
                name: course.from_language_name,
              },
            },
            { type: "sep" },
            { type: "Course stats" },
          ]}
        />
      </EditorHeaderBreadcrumbs>
      <EditorHeaderActions>{null}</EditorHeaderActions>
      <MobileEditorHeader
        backHref={`/editor/course/${course.short ?? courseId}`}
        backLabel="Back to course"
        icon={
          <span className="relative h-7 w-8 shrink-0">
            <LanguageFlag
              languageId={course.learningLanguageId}
              width={24}
              className="absolute top-0 left-0"
            />
            <LanguageFlag
              languageId={course.fromLanguageId}
              width={21}
              className="absolute right-0 bottom-0"
            />
          </span>
        }
        title="Course stats"
        subtitle={course.learning_language_name}
      />
      <div className="mx-auto w-full max-w-[1000px] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-[975px]:px-3">
        <CourseStats courseIdentifier={course.short} />
      </div>
    </>
  );
}

function CourseStatsIcon() {
  return (
    <span className="grid w-8 shrink-0 place-items-center">
      <BarChart3Icon className="size-5" aria-hidden="true" />
    </span>
  );
}
