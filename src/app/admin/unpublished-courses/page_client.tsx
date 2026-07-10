"use client";

import { api } from "@convex/_generated/api";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "convex/react";
import Link from "next/link";
import {
  adminTableContainerClass,
  adminTableHeadCellClass,
} from "../adminTableStyles";

export default function UnpublishedCoursesClient() {
  const courses = useQuery(
    api.adminData.getAdminCoursesWithHiddenPublishedStories,
    {},
  );

  if (courses === undefined) return <Spinner />;

  const totalHiddenStories = courses.reduce(
    (total, course) => total + course.published_story_count,
    0,
  );

  return (
    <div className="relative isolate mx-auto my-6 mb-9 box-border w-full max-w-[min(1040px,calc(100vw-48px))] rounded-2xl border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[var(--body-background)] p-5 shadow-[0_16px_38px_color-mix(in_srgb,#000_14%,transparent)]">
      <div className="flex flex-wrap items-end justify-between gap-4 px-0.5 pb-3">
        <div>
          <h1 className="text-xl font-semibold">
            Unpublished courses with published stories
          </h1>
          <p className="mt-1 text-sm text-[var(--text-color-dim)]">
            {totalHiddenStories} published{" "}
            {totalHiddenStories === 1 ? "story" : "stories"} hidden across{" "}
            {courses.length} unpublished{" "}
            {courses.length === 1 ? "course" : "courses"}.
          </p>
        </div>
      </div>
      <div className={adminTableContainerClass}>
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              <th className={adminTableHeadCellClass}>Course</th>
              <th className={adminTableHeadCellClass}>From</th>
              <th className={adminTableHeadCellClass}>Published stories</th>
              <th className={adminTableHeadCellClass}>Course count</th>
              <th className={`${adminTableHeadCellClass} text-right`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[var(--text-color-dim)]"
                >
                  No unpublished courses currently contain published stories.
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr
                  key={course.id}
                  className="odd:bg-[var(--body-background)] even:bg-[color:color-mix(in_srgb,var(--body-background-faint)_74%,transparent)] hover:brightness-95"
                >
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">
                      {course.learning_language_name}
                    </div>
                    <div className="text-sm text-[var(--text-color-dim)]">
                      {course.name ? `${course.name} ` : ""}
                      {course.short ? `/${course.short}` : `ID ${course.id}`}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">{course.from_language_name}</td>
                  <td className="px-3 py-2.5 font-semibold">
                    {course.published_story_count}
                  </td>
                  <td className="px-3 py-2.5">{course.course_count}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-3">
                      {course.short ? (
                        <Link href={`/editor/course/${course.short}`}>
                          Editor
                        </Link>
                      ) : null}
                      <Link href={`/admin/courses?editCourse=${course.id}`}>
                        Edit course
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
