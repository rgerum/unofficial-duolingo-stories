"use client";

import { PinIcon, SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import LanguageFlag from "@/components/ui/language-flag";
import { CountBadge } from "./CountBadge";
import {
  filterEditorCourses,
  sortEditorCoursesByPin,
} from "./course_list_state";
import type { CourseProps } from "./types";

interface CourseListProps {
  course_id: string | undefined;
}

export default function CourseList({ course_id }: CourseListProps) {
  const data = useQuery(api.editorRead.getEditorSidebarData, {});
  const pinnedCourseIds = useQuery(api.coursePins.listCurrentUserPins, {});
  const [search, setSearch] = React.useState("");

  if (data === undefined || pinnedCourseIds === undefined) {
    return <CourseListLoading />;
  }

  if (data.hasAccess === false) {
    return (
      <CourseListFrame>
        <CourseListMessage
          title="Course access unavailable"
          description="Your account does not currently have access to the editor courses."
        />
      </CourseListFrame>
    );
  }

  const courses = data.courses as CourseProps[];

  if (courses.length === 0) {
    return (
      <CourseListFrame>
        <CourseListMessage
          title="No courses available"
          description="There are currently no editor courses to display."
        />
      </CourseListFrame>
    );
  }

  const pinnedCourseIdSet = new Set(pinnedCourseIds);
  const sortedCourses = sortEditorCoursesByPin(courses, pinnedCourseIds);
  const filteredCourses = filterEditorCourses(sortedCourses, search);

  return (
    <CourseListFrame>
      <CourseSearch value={search} onChange={setSearch} />
      {filteredCourses.length === 0 ? (
        <CourseListMessage
          title="No matching courses"
          description={`No courses match “${search.trim()}”.`}
          action={
            <button
              type="button"
              className="mt-3 min-h-11 rounded-xl border border-[var(--header-border)] px-4 text-sm font-semibold"
              onClick={() => setSearch("")}
            >
              Clear search
            </button>
          }
        />
      ) : (
        <div>
          {filteredCourses.map((course) => (
            <CourseRow
              key={course.id}
              course={course}
              selected={course_id === course.short}
              pinned={pinnedCourseIdSet.has(course.id)}
            />
          ))}
        </div>
      )}
    </CourseListFrame>
  );
}

function CourseListFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="[grid-area:nav] min-h-0 min-w-0 overflow-hidden border-r border-[var(--header-border)] max-[975px]:border-r-0">
      <div className="h-full min-h-0 overflow-auto">{children}</div>
    </div>
  );
}

function CourseSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex h-10 items-center border-b border-[var(--header-border)] bg-[var(--body-background)] pr-[10px] max-[975px]:h-auto max-[975px]:p-3">
      <label
        htmlFor="editor-course-search"
        className="px-[10px] max-[975px]:sr-only"
      >
        Search
      </label>
      <div className="relative min-w-0 flex-1">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 hidden size-4 -translate-y-1/2 text-[var(--text-color-dim)] max-[975px]:block"
        />
        <input
          id="editor-course-search"
          type="search"
          value={value}
          placeholder="Search courses"
          autoComplete="off"
          className="mr-[10px] w-full rounded-2xl border-2 border-[var(--input-border)] bg-[var(--input-background)] py-[1px] pr-11 pl-[6px] text-[19px] text-[var(--text-color)] [&::-webkit-search-cancel-button]:appearance-none max-[975px]:m-0 max-[975px]:h-11 max-[975px]:rounded-xl max-[975px]:pl-10 max-[975px]:text-base"
          onChange={(event) => onChange(event.target.value)}
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear course search"
            className="absolute top-1/2 right-0 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-[var(--text-color-dim)] hover:text-[var(--text-color)] max-[975px]:right-0.5"
            onClick={() => onChange("")}
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CourseRow({
  course,
  selected,
  pinned,
}: {
  course: CourseProps;
  selected: boolean;
  pinned: boolean;
}) {
  const href = `/editor/course/${course.short ?? course.id}`;
  const selectedClassName = selected ? "brightness-90" : "";

  return (
    <Link
      className={`block border-b border-[var(--header-border)] bg-[var(--body-background)] text-[var(--text-color)] no-underline outline-offset-[-2px] hover:brightness-90 focus:brightness-90 ${selectedClassName}`}
      href={href}
    >
      <div className="flex items-center max-[975px]:hidden">
        <span className="w-[45px] text-right text-[var(--text-color-dim)]">
          {course.count}
        </span>
        <LanguageFlag
          className="m-1 ml-4"
          languageId={course.learningLanguageId}
          width={40}
        />
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{`${course.learning_language_name} [${course.from_language_short}] `}</span>
        <span className="flex grow items-center justify-end gap-[6px] whitespace-nowrap pr-[10px]">
          <CourseIssueBadges course={course} />
          <DesktopCourseAffiliation course={course} />
        </span>
      </div>

      <div className="hidden min-h-16 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-3 py-2 max-[975px]:grid">
        <LanguageFlag languageId={course.learningLanguageId} width={40} />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-base font-bold">
              {course.learning_language_name}
            </span>
            {pinned ? (
              <PinIcon
                aria-label="Pinned course"
                className="size-3.5 shrink-0 fill-current text-[var(--button-background)]"
              />
            ) : null}
          </div>
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text-color-dim)]">
              {getMobileCourseMetadata(course)}
            </span>
            <span className="flex shrink-0 items-center justify-end gap-1 whitespace-nowrap">
              <CourseIssueBadges course={course} compact />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CourseIssueBadges({
  course,
  compact = false,
}: {
  course: CourseProps;
  compact?: boolean;
}) {
  return (
    <>
      <CountBadge
        count={course.todo_count}
        icon="📝"
        title={`This course has ${course.todo_count} TODOs.`}
        label={`${course.todo_count} TODOs`}
        className="bg-amber-100 text-amber-900"
        compact={compact}
      />
      <CountBadge
        count={course.audio_problem_count}
        icon="🔊"
        title={`This course has ${course.audio_problem_count} published stories with audio problems.`}
        label={`${course.audio_problem_count} audio problems`}
        className="bg-sky-100 text-sky-950"
        compact={compact}
      />
      <CountBadge
        count={course.unresolved_feedback_count}
        icon="💬"
        title={`This course has ${course.unresolved_feedback_count} unresolved feedback reports.`}
        label={`${course.unresolved_feedback_count} feedback reports`}
        className="bg-emerald-100 text-emerald-950"
        compact={compact}
      />
    </>
  );
}

function DesktopCourseAffiliation({ course }: { course: CourseProps }) {
  if (course.official) {
    return (
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center">
        <img
          src="https://d35aaqx5ub95lt.cloudfront.net/vendor/b3ede3d53c932ee30d981064671c8032.svg"
          title="official"
          alt="Official course"
          className="block h-6 w-6 object-contain"
        />
      </span>
    );
  }
  if (course.contributors.length) {
    return (
      <span className="inline-flex items-center leading-none">
        {`🧑 ${course.contributors.length}`}
      </span>
    );
  }
  return <span className="inline-flex items-center leading-none">💤</span>;
}

function getMobileCourseMetadata(course: CourseProps) {
  const storyLabel = course.count === 1 ? "story" : "stories";
  const affiliation = course.official
    ? "official"
    : course.contributors.length
      ? `${course.contributors.length} contributors`
      : undefined;

  return [
    `from ${course.from_language_name}`,
    `${course.count} ${storyLabel}`,
    affiliation,
  ]
    .filter(Boolean)
    .join(" · ");
}

function CourseListMessage({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-[var(--text-color-dim)]">{description}</p>
      {action}
    </div>
  );
}

function CourseListLoading() {
  return (
    <CourseListFrame>
      <div className="sticky top-0 h-10 animate-pulse border-b border-[var(--header-border)] bg-[var(--body-background-faint)] max-[975px]:m-3 max-[975px]:h-11 max-[975px]:rounded-xl max-[975px]:border" />
      <div aria-label="Loading courses" role="status">
        {Array.from({ length: 7 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-16 animate-pulse items-center gap-3 border-b border-[var(--header-border)] px-3"
          >
            <div className="size-10 rounded-xl bg-[var(--body-background-faint)]" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-2/5 rounded bg-[var(--body-background-faint)]" />
              <div className="mt-2 h-3 w-3/5 rounded bg-[var(--body-background-faint)]" />
            </div>
          </div>
        ))}
        <span className="sr-only">Loading courses…</span>
      </div>
    </CourseListFrame>
  );
}
