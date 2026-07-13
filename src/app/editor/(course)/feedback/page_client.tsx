"use client";

import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import React from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Breadcrumbs } from "@/app/editor/_components/breadcrumbs";
import {
  EditorHeaderActions,
  EditorHeaderBreadcrumbs,
} from "@/app/editor/_components/header_context";
import EditorButton from "../../editor_button";
import type { CourseProps } from "../types";
import FeedbackReviewView, {
  type FeedbackCourseFilter,
  type FeedbackReport,
  type FeedbackStatus,
} from "./feedback_review_view";

export default function StoryFeedbackPageClient({
  courseId,
}: {
  courseId?: string;
}) {
  const [status, setStatus] = React.useState<FeedbackStatus>("open");
  const sidebarData = useQuery(api.editorRead.getEditorSidebarData, {});
  const course = useQuery(
    api.editorRead.getEditorCourseByIdentifier,
    courseId ? { identifier: courseId } : "skip",
  ) as CourseProps | null | undefined;
  const selectedCourseShort =
    courseId === undefined ? undefined : (course?.short ?? courseId);
  const shouldSkipReports = courseId !== undefined && course === undefined;
  const {
    results,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.storyFeedback.listStoryFeedbackReports,
    shouldSkipReports
      ? "skip"
      : {
          status,
          ...(selectedCourseShort ? { courseShort: selectedCourseShort } : {}),
        },
    { initialNumItems: 50 },
  );
  const updateStatus = useMutation(api.storyFeedback.updateStoryFeedbackStatus);
  const [updatingId, setUpdatingId] =
    React.useState<Id<"story_feedback_reports"> | null>(null);
  const courseHref =
    courseId !== undefined && course
      ? `/editor/course/${course.short ?? course.id}`
      : undefined;

  async function setReportStatus(
    reportId: Id<"story_feedback_reports">,
    nextStatus: FeedbackStatus,
  ) {
    setUpdatingId(reportId);
    try {
      await updateStatus({ reportId, status: nextStatus });
    } finally {
      setUpdatingId(null);
    }
  }

  const breadcrumbPath =
    course && courseHref
      ? [
          { type: "Editor", href: "/editor" },
          { type: "sep" },
          {
            type: "course",
            href: courseHref,
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
          { type: "Feedback" },
        ]
      : [
          { type: "Editor", href: "/editor" },
          { type: "sep" },
          { type: "Feedback" },
        ];

  return (
    <>
      <EditorHeaderBreadcrumbs>
        <Breadcrumbs path={breadcrumbPath} />
      </EditorHeaderBreadcrumbs>
      <EditorHeaderActions>
        <EditorButton
          id="button_back"
          href={courseHref ?? "/editor"}
          data-cy="button_back"
          img="back.svg"
          text={courseHref ? "Back" : "Editor"}
        />
      </EditorHeaderActions>

      <FeedbackReviewView
        status={status}
        reports={
          paginationStatus === "LoadingFirstPage" || shouldSkipReports
            ? undefined
            : (results as FeedbackReport[])
        }
        paginationStatus={paginationStatus}
        courses={getCourseFilters(
          (sidebarData?.courses ?? []) as CourseProps[],
        )}
        selectedCourseShort={selectedCourseShort}
        updatingId={updatingId}
        onStatusChange={setStatus}
        onLoadMore={() => loadMore(50)}
        onSetReportStatus={setReportStatus}
      />
    </>
  );
}

function getCourseFilters(courses: CourseProps[]): FeedbackCourseFilter[] {
  return courses
    .filter((course) => course.short)
    .map((course) => ({
      short: course.short ?? "",
      name: `${course.learning_language_name} [${course.from_language_short}]`,
      unresolvedFeedbackCount: course.unresolved_feedback_count,
    }));
}
