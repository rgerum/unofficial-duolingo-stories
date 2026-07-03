"use client";

import {
  CheckCircle2Icon,
  CircleDotIcon,
  ExternalLinkIcon,
  EyeIcon,
  MessageSquareTextIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import type { Id } from "@convex/_generated/dataModel";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type FeedbackStatus = "open" | "reviewed" | "resolved";

export type FeedbackReport = {
  _id: Id<"story_feedback_reports">;
  storyId: number;
  storyTitle: string;
  courseShort: string;
  line?: number;
  lineText?: string;
  category: "Text" | "Translation hints" | "Audio" | "Other";
  comment: string;
  userName: string | null;
  userEmail: string | null;
  status: FeedbackStatus;
  createdAt: number;
};

const statusOptions: Array<{
  value: FeedbackStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "open", label: "Open", icon: CircleDotIcon },
  { value: "reviewed", label: "Reviewed", icon: EyeIcon },
  { value: "resolved", label: "Resolved", icon: CheckCircle2Icon },
];

const statusLabels: Record<FeedbackStatus, string> = {
  open: "Open",
  reviewed: "Reviewed",
  resolved: "Resolved",
};

export default function FeedbackReviewView({
  status,
  reports,
  updatingId,
  onStatusChange,
  onSetReportStatus,
}: {
  status: FeedbackStatus;
  reports?: FeedbackReport[];
  updatingId: Id<"story_feedback_reports"> | null;
  onStatusChange: (status: FeedbackStatus) => void;
  onSetReportStatus: (
    reportId: Id<"story_feedback_reports">,
    status: FeedbackStatus,
  ) => void | Promise<void>;
}) {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 py-6">
      <div className="mb-5 flex flex-col gap-4 min-[760px]:flex-row min-[760px]:items-end min-[760px]:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[0.82rem] font-bold tracking-[0.08em] text-[var(--title-color-dim)] uppercase">
            <MessageSquareTextIcon className="h-4 w-4" />
            Story reports
          </div>
          <h1 className="m-0 text-[1.8rem] leading-tight font-bold">
            Feedback
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const selected = status === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onStatusChange(option.value)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-[0.92rem] font-bold transition-colors",
                  selected
                    ? "border-[var(--button-background)] bg-[var(--button-background)] text-[var(--button-color)]"
                    : "border-[var(--header-border)] bg-[var(--body-background-faint)] text-[var(--text-color)] hover:bg-[var(--body-background)]",
                )}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {reports === undefined ? (
        <Spinner />
      ) : reports.length === 0 ? (
        <div className="rounded-[8px] border-2 border-[var(--overview-hr)] bg-[var(--body-background-faint)] px-5 py-8 text-center text-[var(--text-color-dim)]">
          No {statusLabels[status].toLowerCase()} feedback reports.
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((report) => (
            <FeedbackReportRow
              key={report._id}
              report={report}
              updating={updatingId === report._id}
              onSetStatus={(nextStatus) =>
                onSetReportStatus(report._id, nextStatus)
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}

function FeedbackReportRow({
  report,
  updating,
  onSetStatus,
}: {
  report: FeedbackReport;
  updating: boolean;
  onSetStatus: (status: FeedbackStatus) => void | Promise<void>;
}) {
  const editorHref = getEditorHref(report);
  const linePreview = getLinePreview(report.lineText);

  return (
    <article className="grid gap-4 rounded-[8px] border-2 border-[var(--overview-hr)] bg-[var(--body-background)] p-4 min-[900px]:grid-cols-[minmax(0,1fr)_220px]">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[0.78rem] font-bold",
              getCategoryClassName(report.category),
            )}
          >
            {report.category === "Translation hints"
              ? "Translation"
              : report.category}
          </span>
          <span className="rounded-full bg-[var(--body-background-faint)] px-3 py-1 text-[0.78rem] font-bold text-[var(--text-color-dim)]">
            {statusLabels[report.status]}
          </span>
          <time className="text-[0.82rem] text-[var(--text-color-dim)]">
            {formatDateTime(report.createdAt)}
          </time>
        </div>

        <h2 className="m-0 mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-[1.15rem] font-bold">
          {report.storyTitle}
        </h2>
        <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.9rem] text-[var(--text-color-dim)]">
          <span>{report.courseShort}</span>
          <span>Story {report.storyId}</span>
          {report.line ? <span>Line {report.line}</span> : null}
          <span>{report.userName || report.userEmail || "Anonymous"}</span>
        </div>

        {linePreview ? (
          <blockquote className="m-0 mb-3 rounded-[8px] border-l-4 border-[var(--overview-hr)] bg-[var(--body-background-faint)] px-4 py-3 text-[0.95rem] leading-6 whitespace-pre-wrap">
            {linePreview}
          </blockquote>
        ) : null}

        <p className="m-0 whitespace-pre-wrap text-[1rem] leading-7">
          {report.comment}
        </p>
      </div>

      <div className="flex flex-col gap-3 min-[900px]:items-stretch">
        <Link
          href={editorHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[12px] border-2 border-[var(--button-blue-border)] bg-[var(--button-blue-background)] px-4 text-center font-bold text-[var(--button-blue-color)]"
        >
          <ExternalLinkIcon className="h-4 w-4" />
          Open in editor
        </Link>

        <div className="grid grid-cols-2 gap-2 min-[900px]:grid-cols-1">
          {report.status !== "open" ? (
            <StatusButton
              disabled={updating}
              onClick={() => onSetStatus("open")}
            >
              Open
            </StatusButton>
          ) : null}
          {report.status !== "reviewed" ? (
            <StatusButton
              disabled={updating}
              onClick={() => onSetStatus("reviewed")}
            >
              Reviewed
            </StatusButton>
          ) : null}
          {report.status !== "resolved" ? (
            <StatusButton
              disabled={updating}
              onClick={() => onSetStatus("resolved")}
            >
              Resolved
            </StatusButton>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function StatusButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => {
        void onClick();
      }}
    >
      {disabled ? "Updating" : children}
    </Button>
  );
}

function getEditorHref(report: FeedbackReport) {
  const lineSearch = report.line ? `?line=${report.line}` : "";
  return `/editor/course/${report.courseShort}/story/${report.storyId}${lineSearch}`;
}

function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function getLinePreview(lineText?: string) {
  if (!lineText) return "";

  return (
    lineText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? ""
  );
}

function getCategoryClassName(category: FeedbackReport["category"]) {
  if (category === "Audio") {
    return "bg-[#e9f6ff] text-[#075985]";
  }
  if (category === "Translation hints") {
    return "bg-[#eef7e9] text-[#2f6b22]";
  }
  if (category === "Text") {
    return "bg-[#fff4d6] text-[#7a4a00]";
  }
  return "bg-[var(--body-background-faint)] text-[var(--text-color)]";
}
