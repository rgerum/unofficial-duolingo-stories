"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import LanguageFlag from "@/components/ui/language-flag";
import ImportList from "./import_list";
import { Spinner } from "@/components/ui/spinner";
import type { CourseProps } from "@/app/editor/(course)/types";

export default function ImportPageClient({
  courseId,
  fromId,
}: {
  courseId: string;
  fromId: string;
}) {
  const sidebarData = useQuery(api.editorRead.getEditorSidebarData, {});
  const course = useQuery(api.editorRead.getEditorCourseByIdentifier, {
    identifier: courseId,
  });

  if (sidebarData === undefined || course === undefined) {
    return <Spinner />;
  }

  if (!course) {
    return <p>Course not found.</p>;
  }

  const courses = (sidebarData.courses ?? []) as CourseProps[];

  const courseSelection: CourseProps[] = [];
  for (const item of courses) {
    if (item.short === "es-en") courseSelection.push(item);
  }
  for (const item of courses) {
    if (item.short === "en-es-o") courseSelection.push(item);
  }
  for (const item of courses) {
    if (item.official && item.short !== "es-en" && item.short !== "en-es-o") {
      courseSelection.push(item);
    }
  }

  return (
    <>
      <div className="flex gap-3 overflow-scroll whitespace-nowrap p-1">
        {courseSelection.map((item, index) => (
          <Link
            key={index}
            href={`/editor/course/${course.short}/import/${item.short}`}
          >
            <span className="flex items-center flex-col rounded-lg bg-[var(--body-background)] px-2 py-1 hover:brightness-90">
              <span className="flex [&_img:nth-child(2)]:ml-[-28px] [&_img:nth-child(2)]:mt-[10px]">
                <LanguageFlag languageId={item.learningLanguageId} width={40} />
                <LanguageFlag languageId={item.fromLanguageId} width={36} />
              </span>
              <span>
                {item.from_language_short}-{item.learning_language_short}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <ImportList courseId={courseId} fromId={fromId} />
    </>
  );
}
