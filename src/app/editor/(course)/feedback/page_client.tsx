"use client";

import { MessageSquareTextIcon } from "lucide-react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import React from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Breadcrumbs } from "@/app/editor/_components/breadcrumbs";
import {
  EditorHeaderActions,
  EditorHeaderBreadcrumbs,
} from "@/app/editor/_components/header_context";
import MobileEditorHeader from "@/app/editor/_components/mobile_editor_header";
import { createFeedbackReturnHref } from "@/app/editor/feedback/feedback_return_navigation";
import {
  readPendingFeedbackView,
  restorePendingFeedbackView,
} from "@/app/editor/feedback/feedback_view_memory";
import EditorButton from "../../editor_button";
import type { CourseProps } from "../types";
import FeedbackReviewView, {
  type FeedbackCourseFilter,
  type FeedbackReport,
  type FeedbackStatus,
} from "./feedback_review_view";

export default function StoryFeedbackPageClient({
  courseId,
  initialStatus = "open",
}: {
  courseId?: string;
  initialStatus?: FeedbackStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState<FeedbackStatus>(initialStatus);
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
  const feedbackReturnHref = createFeedbackReturnHref(courseId, status);
  const restoreRequestSizeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  React.useLayoutEffect(() => {
    if (paginationStatus === "LoadingFirstPage" || shouldSkipReports) return;

    const pendingView = readPendingFeedbackView(feedbackReturnHref);
    if (!pendingView) return;

    if (
      results.length < pendingView.loadedReportCount &&
      paginationStatus !== "Exhausted"
    ) {
      if (
        paginationStatus === "CanLoadMore" &&
        restoreRequestSizeRef.current !== results.length
      ) {
        restoreRequestSizeRef.current = results.length;
        loadMore(Math.max(50, pendingView.loadedReportCount - results.length));
      }
      return;
    }

    restoreRequestSizeRef.current = null;
    return restorePendingFeedbackView(feedbackReturnHref);
  }, [
    feedbackReturnHref,
    loadMore,
    paginationStatus,
    results.length,
    shouldSkipReports,
  ]);

  function changeStatus(nextStatus: FeedbackStatus) {
    const nextHref = createFeedbackReturnHref(courseId, nextStatus);
    setStatus(nextStatus);
    router.replace(nextHref, { scroll: false });
  }

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
      <MobileEditorHeader
        backHref={courseHref ?? "/editor"}
        backLabel={courseHref ? "Back to course" : "Back to editor"}
        icon={<MessageSquareTextIcon className="size-5 shrink-0" />}
        title="Feedback"
        subtitle={selectedCourseShort}
      />

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
        returnHref={feedbackReturnHref}
        updatingId={updatingId}
        onStatusChange={changeStatus}
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
