"use client";

import { api } from "@convex/_generated/api";
import { Heart, Trophy } from "lucide-react";
import { useQuery } from "convex/react";
import Link from "next/link";
import LanguageFlag from "@/components/ui/language-flag";
import { Spinner } from "@/components/ui/spinner";

export default function InterestList() {
  const courses = useQuery(api.courseInterest.listForEditor, {});

  if (courses === undefined) return <Spinner />;

  return (
    <div className="mx-auto max-w-[800px] p-5 max-[975px]:max-w-none max-[975px]:p-0">
      <h1 className="flex items-center gap-3 text-[calc(24/16*1rem)] font-bold max-[975px]:sr-only">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9ffc2] text-[#58a700] dark:bg-[#315d24] dark:text-[#9be66e]">
          <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
        </span>
        Learner interest
      </h1>
      <p className="mt-2 text-[var(--text-color-dim)] max-[975px]:sr-only">
        Courses ranked by how many learners asked for more stories.
      </p>
      {courses.length === 0 ? (
        <p className="mt-6 text-[var(--text-color-dim)] max-[975px]:px-3">
          No learner signals yet.
        </p>
      ) : (
        <ol className="mt-6 list-none p-0 max-[975px]:mt-0">
          {courses.map((course, index) => {
            const name = `${course.learningLanguageName} [${course.fromLanguageShort}]`;
            const storyLabel = course.storyCount === 1 ? "story" : "stories";
            const content = (
              <>
                <div className="flex items-center border-b border-[var(--header-border)] py-1 pr-3 text-[var(--text-color)] max-[975px]:hidden">
                  <span className="w-8 shrink-0 text-right text-[var(--text-color-dim)]">
                    {index + 1}.
                  </span>
                  <LanguageFlag
                    className="m-1 ml-3"
                    languageId={course.learningLanguageId}
                    width={40}
                  />
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {name}
                  </span>
                  {!course.public ? <CourseVisibilityBadge /> : null}
                  <InterestStats
                    totalCount={course.totalCount}
                    completedAllCount={course.completedAllCount}
                  />
                </div>

                <div className="hidden min-h-16 grid-cols-[auto_2.5rem_minmax(0,1fr)] items-center gap-2 border-b border-[var(--header-border)] px-3 py-2 text-[var(--text-color)] max-[975px]:grid">
                  <span className="min-w-6 whitespace-nowrap text-right text-sm font-semibold text-[var(--text-color-dim)]">
                    {index + 1}
                  </span>
                  <LanguageFlag
                    languageId={course.learningLanguageId}
                    width={40}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-base font-bold">
                      {course.learningLanguageName}
                    </span>
                    <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="min-w-0 basis-28 flex-1 truncate text-[13px] text-[var(--text-color-dim)]">
                        from {course.fromLanguageShort} · {course.storyCount}{" "}
                        {storyLabel}
                      </span>
                      {!course.public ? (
                        <CourseVisibilityBadge compact />
                      ) : null}
                      <InterestStats
                        totalCount={course.totalCount}
                        completedAllCount={course.completedAllCount}
                        compact
                      />
                    </span>
                  </span>
                </div>
              </>
            );
            return (
              <li key={course.courseShort ?? name}>
                {course.courseShort ? (
                  <Link
                    className="block text-[var(--text-color)] no-underline hover:brightness-90 focus:brightness-90"
                    href={`/editor/course/${course.courseShort}`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function CourseVisibilityBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={
        compact
          ? "shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] leading-none text-amber-900"
          : "shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[calc(12/16*1rem)] text-amber-900"
      }
    >
      not public
    </span>
  );
}

function InterestStats({
  totalCount,
  completedAllCount,
  compact = false,
}: {
  totalCount: number;
  completedAllCount: number;
  compact?: boolean;
}) {
  const completedLabel = `${completedAllCount} ${
    completedAllCount === 1 ? "learner" : "learners"
  } finished all available stories before asking for more`;
  const interestLabel = `${totalCount} ${
    totalCount === 1 ? "learner wants" : "learners want"
  } more stories`;

  return (
    <span
      className={
        compact
          ? "flex shrink-0 items-center gap-2"
          : "ml-auto flex shrink-0 items-center gap-4 pl-3"
      }
    >
      {completedAllCount > 0 ? (
        <span
          role="img"
          className={
            compact
              ? "inline-flex items-center gap-1 text-sm text-[var(--text-color-dim)]"
              : "flex items-center gap-1 text-[var(--text-color-dim)]"
          }
          title={`${completedLabel}.`}
          aria-label={completedLabel}
        >
          <Trophy
            className={
              compact ? "size-4 text-[#d79b00]" : "h-4 w-4 text-[#d79b00]"
            }
            aria-hidden="true"
          />
          {completedAllCount}
        </span>
      ) : null}
      <span
        role="img"
        className={
          compact
            ? "inline-flex min-w-12 items-center justify-end gap-1 text-base font-bold text-[#58a700] dark:text-[#9be66e]"
            : "flex w-14 items-center justify-end gap-1 font-bold text-[#58a700] dark:text-[#9be66e]"
        }
        title={`${interestLabel}.`}
        aria-label={interestLabel}
      >
        <Heart
          className={
            compact ? "size-4 fill-current" : "h-4 w-4 shrink-0 fill-current"
          }
          aria-hidden="true"
        />
        {totalCount}
      </span>
    </span>
  );
}
