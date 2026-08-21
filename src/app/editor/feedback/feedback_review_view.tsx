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
  legacyUserId?: number;
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
    <main className="mx-auto w-full max-w-[1120px] px-5 py-6 max-[975px]:px-3 max-[975px]:py-3">
      <div className="mb-5 flex flex-col gap-4 max-[975px]:mb-1 max-[975px]:gap-1 min-[976px]:flex-row min-[976px]:items-end min-[976px]:justify-between">
        <div className="max-[975px]:hidden">
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

        <div className="flex flex-wrap gap-2 max-[975px]:-mx-3 max-[975px]:w-[calc(100%+1.5rem)] max-[975px]:flex-none max-[975px]:flex-nowrap max-[975px]:gap-0 max-[975px]:overflow-x-auto max-[975px]:px-3">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const selected = status === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onStatusChange(option.value)}
                className="group inline-flex shrink-0 items-center justify-center max-[975px]:min-h-11 max-[975px]:px-1"
              >
                <span
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-[0.92rem] font-bold transition-colors max-[975px]:min-h-0 max-[975px]:gap-1.5 max-[975px]:px-2.5 max-[975px]:py-1.5 max-[975px]:text-[13px]",
                    selected
                      ? "border-[var(--button-background)] bg-[var(--button-background)] text-[var(--button-color)]"
                      : "border-[var(--header-border)] bg-[var(--body-background-faint)] text-[var(--text-color)] group-hover:bg-[var(--body-background)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {courses && courses.length > 0 ? (
        <nav className="mb-5 flex gap-2 overflow-x-auto pb-1 max-[975px]:-mx-3 max-[975px]:mb-2 max-[975px]:w-[calc(100%+1.5rem)] max-[975px]:gap-0 max-[975px]:px-3 max-[975px]:pb-0">
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
                showCourse={selectedCourseShort === undefined}
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
      aria-label={count && count > 0 ? `${label}: ${count}` : label}
      className="group inline-flex shrink-0 items-center justify-center no-underline max-[975px]:min-h-11 max-[975px]:px-1"
    >
      <span
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[0.9rem] font-bold transition-colors max-[975px]:h-auto max-[975px]:gap-1.5 max-[975px]:px-2.5 max-[975px]:py-1.5 max-[975px]:text-[13px]",
          selected
            ? "border-[var(--button-background)] bg-[var(--button-background)] text-[var(--button-color)]"
            : "border-[var(--header-border)] bg-[var(--body-background-faint)] text-[var(--text-color)] group-hover:bg-[var(--body-background)]",
        )}
      >
        <span>{label}</span>
        {count && count > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--body-background)_85%,transparent)] px-1.5 text-[0.72rem]">
            {count}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function FeedbackReportRow({
  report,
  showCourse,
  updating,
  onSetStatus,
}: {
  report: FeedbackReport;
  showCourse: boolean;
  updating: boolean;
  onSetStatus: (status: FeedbackStatus) => void | Promise<void>;
}) {
  const editorHref = getEditorHref(report);

  return (
    <article className="grid gap-4 rounded-[8px] border-2 border-[var(--overview-hr)] bg-[var(--body-background)] p-4 max-[975px]:gap-3 max-[975px]:p-3 min-[976px]:grid-cols-[minmax(0,1fr)_220px]">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 max-[975px]:grid max-[975px]:grid-cols-[minmax(0,1fr)_auto] max-[975px]:items-start max-[975px]:gap-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2 max-[975px]:gap-1.5">
            <span
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[0.78rem] font-bold",
                getCategoryClassName(report.category),
              )}
            >
              {report.category === "Translation hints"
                ? "Translation"
                : report.category}
            </span>
            <span className="rounded-full bg-[var(--body-background-faint)] px-3 py-1 text-[0.78rem] font-bold text-[var(--text-color-dim)] max-[975px]:hidden">
              {getStatusLabel(report.status)}
            </span>
            <time
              dateTime={new Date(report.createdAt).toISOString()}
              title={formatDateTime(report.createdAt)}
              className="shrink-0 text-[0.82rem] text-[var(--text-color-dim)]"
            >
              <span className="min-[976px]:hidden" suppressHydrationWarning>
                {formatRelativeDate(report.createdAt)}
              </span>
              <span className="max-[975px]:hidden">
                {formatDateTime(report.createdAt)}
              </span>
            </time>
            <span className="shrink-0 text-[13px] text-[var(--text-color-dim)] min-[976px]:hidden">
              {getFeedbackSourceLabel(report)}
            </span>
            {showCourse ? (
              <span className="shrink-0 text-[13px] text-[var(--text-color-dim)] min-[976px]:hidden">
                {report.courseShort}
              </span>
            ) : null}
          </div>
          <select
            aria-label={`Status for ${report.storyTitle}`}
            value={report.status}
            disabled={updating}
            onChange={(event) =>
              onSetStatus(event.target.value as FeedbackStatus)
            }
            className="min-h-11 max-w-[7.5rem] shrink-0 rounded-full border border-[var(--header-border)] bg-[var(--body-background-faint)] px-2.5 text-[13px] font-bold text-[var(--text-color)] min-[976px]:hidden"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {updating && option.value === report.status
                  ? "Updating"
                  : option.label}
              </option>
            ))}
          </select>
        </div>

        <h2 className="m-0 mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-[1.15rem] font-bold">
          <Link
            href={editorHref}
            className="inline-flex max-w-full items-center gap-1.5 overflow-hidden text-[var(--text-color)] no-underline min-[976px]:hidden"
          >
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {report.storyTitle}
            </span>
            <ExternalLinkIcon className="size-4 shrink-0" />
          </Link>
          <span className="max-[975px]:hidden">{report.storyTitle}</span>
        </h2>
        <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.9rem] text-[var(--text-color-dim)] max-[975px]:hidden">
          <span>{report.courseShort}</span>
          <span>Story {report.storyId}</span>
          {report.line !== undefined ? <span>Line {report.line}</span> : null}
          <span>{getFeedbackSourceLabel(report)}</span>
          {report.legacyUserId === undefined ? (
            report.userName || report.userEmail ? (
              <span>{report.userName || report.userEmail}</span>
            ) : (
              <span className="max-[975px]:hidden">Anonymous</span>
            )
          ) : (
            <Link
              href={`/admin/users/${report.legacyUserId}`}
              className="font-bold text-[var(--link-color)] underline underline-offset-2"
              title={report.userEmail ?? undefined}
            >
              {report.userName || report.userEmail || "View user"}
            </Link>
          )}
        </div>

        {isStoryElementLine(report.lineElement) ? (
          <div className="mb-3 min-w-0 overflow-hidden rounded-[8px] border-l-4 border-[var(--overview-hr)] bg-[var(--body-background-faint)] px-4 py-1 max-[975px]:mb-2 max-[975px]:px-3">
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
          <blockquote className="m-0 mb-3 rounded-[8px] border-l-4 border-[var(--overview-hr)] bg-[var(--body-background-faint)] px-4 py-3 text-[0.95rem] leading-6 max-[975px]:mb-2 max-[975px]:px-3 max-[975px]:py-2 max-[975px]:text-[14px] max-[975px]:leading-5">
            {report.lineText}
          </blockquote>
        ) : null}

        <p className="m-0 whitespace-pre-wrap text-[1rem] leading-7">
          {report.comment}
        </p>
      </div>

      <div className="flex flex-col gap-3 max-[975px]:hidden min-[976px]:items-stretch">
        <Link
          href={editorHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[12px] border-2 border-[var(--button-blue-border)] bg-[var(--button-blue-background)] px-4 text-center font-bold text-[var(--button-blue-color)] max-[975px]:hidden"
        >
          <ExternalLinkIcon className="h-4 w-4" />
          Open in editor
        </Link>

        <div className="grid grid-cols-2 gap-2 max-[975px]:hidden min-[976px]:grid-cols-1">
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

function formatRelativeDate(timestamp: number) {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 60_000),
  );
  if (elapsedMinutes < 1) return "now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 30) return `${elapsedDays}d`;
  if (elapsedDays < 365) return `${Math.floor(elapsedDays / 30)}mo`;
  return `${Math.floor(elapsedDays / 365)}y`;
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
