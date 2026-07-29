"use client";

import { api } from "@convex/_generated/api";
import { Heart, Trophy } from "lucide-react";
import { useQuery } from "convex/react";

export default function CourseInterestSummary({
  courseIdentifier,
}: {
  courseIdentifier: string | null;
}) {
  const stats = useQuery(
    api.courseInterest.getForEditor,
    courseIdentifier ? { courseIdentifier } : "skip",
  );

  if (!courseIdentifier || stats === undefined) return null;

  return (
    <section className="my-6 rounded-2xl border-2 border-[#8fd55c] bg-[#f6ffef] p-5 dark:border-[#416f31] dark:bg-[#20301d]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9ffc2] text-[#58a700] dark:bg-[#315d24] dark:text-[#9be66e]">
          <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-[calc(19/16*1rem)] font-bold">
            Learner interest
          </h2>
          {stats?.totalCount ? (
            <>
              <p className="mt-1 text-[calc(17/16*1rem)]">
                <strong>{stats.totalCount}</strong>{" "}
                {stats.totalCount === 1 ? "learner wants" : "learners want"}{" "}
                more stories in this course.
              </p>
              {stats.completedAllCount > 0 ? (
                <p className="mt-2 flex items-center gap-2 text-[calc(14/16*1rem)] text-[var(--text-color-dim)]">
                  <Trophy
                    className="h-4 w-4 shrink-0 text-[#d79b00]"
                    aria-hidden="true"
                  />
                  {stats.completedAllCount}{" "}
                  {stats.completedAllCount === 1 ? "has" : "have"} completed
                  every published story.
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-1 text-[var(--text-color-dim)]">
              No learner signals yet. A request card is shown below the public
              story list.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
