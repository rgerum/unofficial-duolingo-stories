"use client";

import { useMutation, usePaginatedQuery } from "convex/react";
import Link from "next/link";
import React from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Breadcrumbs } from "@/app/editor/_components/breadcrumbs";
import {
  EditorHeaderActions,
  EditorHeaderBreadcrumbs,
} from "@/app/editor/_components/header_context";
import FeedbackReviewView, {
  type FeedbackReport,
  type FeedbackStatus,
} from "./feedback_review_view";

export default function StoryFeedbackPageClient() {
  const [status, setStatus] = React.useState<FeedbackStatus>("open");
  const {
    results,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.storyFeedback.listStoryFeedbackReports,
    { status },
    { initialNumItems: 50 },
  );
  const updateStatus = useMutation(api.storyFeedback.updateStoryFeedbackStatus);
  const [updatingId, setUpdatingId] =
    React.useState<Id<"story_feedback_reports"> | null>(null);

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

  return (
    <>
      <EditorHeaderBreadcrumbs>
        <Breadcrumbs
          path={[
            { type: "Editor", href: "/editor" },
            { type: "sep" },
            { type: "Feedback" },
          ]}
        />
      </EditorHeaderBreadcrumbs>
      <EditorHeaderActions>
        <Link
          href="/editor"
          className="inline-flex min-h-10 items-center rounded-[12px] border-2 border-[var(--overview-hr)] bg-[var(--body-background)] px-4 text-[0.92rem] font-bold text-[var(--text-color)] hover:bg-[var(--body-background-faint)]"
        >
          Editor
        </Link>
      </EditorHeaderActions>

      <FeedbackReviewView
        status={status}
        reports={
          paginationStatus === "LoadingFirstPage"
            ? undefined
            : (results as FeedbackReport[])
        }
        paginationStatus={paginationStatus}
        updatingId={updatingId}
        onStatusChange={setStatus}
        onLoadMore={() => loadMore(50)}
        onSetReportStatus={setReportStatus}
      />
    </>
  );
}
