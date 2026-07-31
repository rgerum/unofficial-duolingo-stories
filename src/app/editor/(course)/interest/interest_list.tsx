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
    <div className="mx-auto max-w-[800px] p-5">
      <h1 className="flex items-center gap-3 text-[calc(24/16*1rem)] font-bold">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9ffc2] text-[#58a700] dark:bg-[#315d24] dark:text-[#9be66e]">
          <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
        </span>
        Learner interest
      </h1>
      <p className="mt-2 text-[var(--text-color-dim)]">
        Courses ranked by how many learners asked for more stories.
      </p>
      {courses.length === 0 ? (
        <p className="mt-6 text-[var(--text-color-dim)]">
          No learner signals yet.
        </p>
      ) : (
        <ol className="mt-6 list-none p-0">
          {courses.map((course, index) => {
            const name = `${course.learningLanguageName} [${course.fromLanguageShort}]`;
            const content = (
              <>
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
                {!course.public ? (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[calc(12/16*1rem)] text-amber-900">
                    not public
                  </span>
                ) : null}
                <span className="ml-auto flex shrink-0 items-center gap-4 pl-3">
                  {course.completedAllCount > 0 ? (
                    <span
                      className="flex items-center gap-1 text-[var(--text-color-dim)]"
                      title={`${course.completedAllCount} ${
                        course.completedAllCount === 1 ? "learner" : "learners"
                      } finished all available stories before asking for more.`}
                    >
                      <Trophy
                        className="h-4 w-4 text-[#d79b00]"
                        aria-hidden="true"
                      />
                      {course.completedAllCount}
                    </span>
                  ) : null}
                  <span
                    className="flex w-14 items-center justify-end gap-1 font-bold text-[#58a700] dark:text-[#9be66e]"
                    title={`${course.totalCount} ${
                      course.totalCount === 1
                        ? "learner wants"
                        : "learners want"
                    } more stories.`}
                  >
                    <Heart
                      className="h-4 w-4 shrink-0 fill-current"
                      aria-hidden="true"
                    />
                    {course.totalCount}
                  </span>
                </span>
              </>
            );
            const rowClass =
              "flex items-center border-b border-[var(--header-border)] py-1 pr-3 text-[var(--text-color)]";
            return (
              <li key={course.courseShort ?? name}>
                {course.courseShort ? (
                  <Link
                    className={`${rowClass} no-underline hover:brightness-90 focus:brightness-90`}
                    href={`/editor/course/${course.courseShort}`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className={rowClass}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
