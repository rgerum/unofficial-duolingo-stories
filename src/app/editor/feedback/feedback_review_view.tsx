"use client";

import {
  BanIcon,
  CheckCircle2Icon,
  CircleOffIcon,
  CircleDotIcon,
  ExternalLinkIcon,
  EyeIcon,
  MessageSquareTextIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import type { Doc, Id } from "@convex/_generated/dataModel";
import StoryTextLine from "@/components/StoryTextLine";
import type { StorySettings } from "@/components/StoryProgress";
import type { StoryElementLine } from "@/components/editor/story/syntax_parser_types";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type FeedbackStatus = Doc<"story_feedback_reports">["status"];

export type FeedbackReport = {
  _id: Id<"story_feedback_reports">;
  storyId: number;
  storyTitle: string;
  courseShort: string;
  line?: number;
  lineText?: string;
  lineElement?: unknown;
  operationKey?: string;
  source?: "web" | "android" | "ios";
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
  { value: "not_relevant", label: "Not relevant", icon: CircleOffIcon },
  { value: "spam", label: "Spam", icon: BanIcon },
];

const sourceLabels = {
  web: "Web",
  android: "Android",
  ios: "iOS",
} as const;

function getFeedbackSourceLabel(report: FeedbackReport) {
  if (report.source) return sourceLabels[report.source];
  return report.operationKey?.startsWith("mobile-feedback:")
    ? "Mobile (legacy)"
    : "Web (legacy)";
}

export type FeedbackCourseFilter = {
  short: string;
  name: string;
  unresolvedFeedbackCount: number;
};

const feedbackPreviewSettings: StorySettings = {
  hide_questions: false,
  show_all: true,
  show_names: false,
  rtl: false,
  highlight_name: [],
  hideNonHighlighted: false,
  setHighlightName: () => {},
  setHideNonHighlighted: () => {},
  show_hints: true,
  setShowHints: () => {},
  show_audio: true,
  setShowAudio: () => {},
  id: 0,
  show_title_page: false,
};

export default function FeedbackReviewView({
  status,
  reports,
  paginationStatus,
  courses,
  selectedCourseShort,
  updatingId,
  onStatusChange,
  onLoadMore,
  onSetReportStatus,
}: {
  status: FeedbackStatus;
  reports?: FeedbackReport[];
  paginationStatus?:
    | "LoadingFirstPage"
    | "CanLoadMore"
    | "LoadingMore"
    | "Exhausted";
  courses?: FeedbackCourseFilter[];
  selectedCourseShort?: string;
  updatingId: Id<"story_feedback_reports"> | null;
  onStatusChange: (status: FeedbackStatus) => void;
  onLoadMore?: () => void;
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
            {selectedCourseShort
              ? `${selectedCourseShort} feedback`
              : "Feedback"}
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

      {courses && courses.length > 0 ? (
        <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">
          <CourseFilterLink
            href="/editor/feedback"
            selected={selectedCourseShort === undefined}
            label="All"
          />
          {courses.map((course) => (
            <CourseFilterLink
              key={course.short}
              href={`/editor/course/${course.short}/feedback`}
              selected={selectedCourseShort === course.short}
              label={course.name}
              count={course.unresolvedFeedbackCount}
            />
          ))}
        </nav>
      ) : null}

      {reports === undefined ? (
        <Spinner />
      ) : reports.length === 0 ? (
        <div className="rounded-[8px] border-2 border-[var(--overview-hr)] bg-[var(--body-background-faint)] px-5 py-8 text-center text-[var(--text-color-dim)]">
          No {getStatusLabel(status).toLowerCase()} feedback reports.
        </div>
      ) : (
        <>
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
          {paginationStatus === "CanLoadMore" ||
          paginationStatus === "LoadingMore" ? (
            <div className="mt-5 flex justify-center">
              <Button
                type="button"
                variant="secondary"
                disabled={paginationStatus === "LoadingMore"}
                onClick={onLoadMore}
              >
                {paginationStatus === "LoadingMore" ? "Loading" : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

function CourseFilterLink({
  href,
  selected,
  label,
  count,
}: {
  href: string;
  selected: boolean;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[0.9rem] font-bold no-underline transition-colors",
        selected
          ? "border-[var(--button-background)] bg-[var(--button-background)] text-[var(--button-color)]"
          : "border-[var(--header-border)] bg-[var(--body-background-faint)] text-[var(--text-color)] hover:bg-[var(--body-background)]",
      )}
    >
      <span>{label}</span>
      {count && count > 0 ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--body-background)_85%,transparent)] px-1.5 text-[0.72rem]">
          {count}
        </span>
      ) : null}
    </Link>
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
            {getStatusLabel(report.status)}
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
          {report.line !== undefined ? <span>Line {report.line}</span> : null}
          <span>{getFeedbackSourceLabel(report)}</span>
          <span>{report.userName || report.userEmail || "Anonymous"}</span>
        </div>

        {isStoryElementLine(report.lineElement) ? (
          <div className="mb-3 min-w-0 overflow-hidden rounded-[8px] border-l-4 border-[var(--overview-hr)] bg-[var(--body-background-faint)] px-4 py-1">
            <StoryTextLine
              active={false}
              element={report.lineElement}
              settings={feedbackPreviewSettings}
              editorShowTranslationsOverride={true}
              editorShowAudioDetailsOverride={false}
              compact
            />
          </div>
        ) : report.lineText ? (
          <blockquote className="m-0 mb-3 rounded-[8px] border-l-4 border-[var(--overview-hr)] bg-[var(--body-background-faint)] px-4 py-3 text-[0.95rem] leading-6">
            {report.lineText}
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
          {statusOptions.map((option) =>
            report.status === option.value ? null : (
              <StatusButton
                key={option.value}
                disabled={updating}
                onClick={() => onSetStatus(option.value)}
              >
                {option.label}
              </StatusButton>
            ),
          )}
        </div>
      </div>
    </article>
  );
}

function isStoryElementLine(value: unknown): value is StoryElementLine {
  if (!isRecord(value) || value.type !== "LINE") return false;
  if (!isRecord(value.line) || !isRecord(value.editor)) return false;
  if (!isRecord(value.trackingProperties)) return false;
  if (typeof value.lang !== "string") return false;
  if (
    value.line.type !== "CHARACTER" &&
    value.line.type !== "PROSE" &&
    value.line.type !== "TITLE"
  ) {
    return false;
  }
  if (!isRecord(value.line.content)) return false;
  if (typeof value.line.content.text !== "string") return false;
  if (!isValidHintMap(value.line.content.hintMap)) return false;
  if (
    value.line.content.hints !== undefined &&
    !isStringArray(value.line.content.hints)
  ) {
    return false;
  }
  if (
    value.line.content.hints_pronunciation !== undefined &&
    !isStringArray(value.line.content.hints_pronunciation)
  ) {
    return false;
  }
  if (
    value.hideRangesForChallenge !== undefined &&
    !isValidHideRanges(value.hideRangesForChallenge)
  ) {
    return false;
  }
  if (
    value.line.content.audio !== undefined &&
    !isValidLineAudio(value.line.content.audio)
  ) {
    return false;
  }
  if (value.line.type !== "CHARACTER") return true;

  return (
    (typeof value.line.characterId === "number" ||
      typeof value.line.characterId === "string") &&
    (value.line.avatarUrl === undefined ||
      typeof value.line.avatarUrl === "string") &&
    (value.line.characterName === undefined ||
      typeof value.line.characterName === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isValidHintMap(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.hintIndex === "number" &&
        typeof item.rangeFrom === "number" &&
        typeof item.rangeTo === "number",
    )
  );
}

function isValidHideRanges(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.start === "number" &&
        typeof item.end === "number",
    )
  );
}

function isValidLineAudio(value: unknown) {
  if (!isRecord(value)) return false;
  if (value.url !== undefined && typeof value.url !== "string") return false;
  if (
    value.keypoints !== undefined &&
    !(
      Array.isArray(value.keypoints) &&
      value.keypoints.every(
        (item) =>
          isRecord(item) &&
          typeof item.rangeEnd === "number" &&
          typeof item.audioStart === "number",
      )
    )
  ) {
    return false;
  }
  return value.ssml === undefined || isRecord(value.ssml);
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

function getStatusLabel(status: FeedbackStatus) {
  return (
    statusOptions.find((option) => option.value === status)?.label ?? status
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
