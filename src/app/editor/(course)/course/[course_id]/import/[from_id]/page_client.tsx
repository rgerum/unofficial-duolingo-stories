"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { DoubleFlag } from "@/components/layout/flag";
import ImportList from "./import_list";
import styles from "./import_list.module.css";
import { Spinner } from "@/components/layout/spinner";
import type {
  CourseProps,
  LanguageProps,
} from "@/app/editor/(course)/types";

function buildLanguageLookup(
  languages: Array<LanguageProps>,
): Record<string | number, LanguageProps> {
  const lookup: Record<string | number, LanguageProps> = {};
  for (const language of languages) {
    lookup[language.id] = language;
    lookup[language.short] = language;
  }
  return lookup;
}

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
  const languagesList = (sidebarData.languages ?? []) as LanguageProps[];
  const languages = buildLanguageLookup(languagesList);

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
      <div className={styles.lang_selector}>
        {courseSelection.map((item, index) => (
          <Link
            key={index}
            href={`/editor/course/${course.short}/import/${item.short}`}
          >
            <span className={styles.import_lang}>
              <span className={styles.double_flag}>
                <DoubleFlag
                  width={40}
                  lang1={languages[item.learning_language]}
                  lang2={languages[item.from_language]}
                  className={styles.flag}
                />
              </span>
              <span>
                {languages[item.from_language]?.short}-
                {languages[item.learning_language]?.short}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <ImportList
        courseId={courseId}
        fromId={fromId}
      />
    </>
  );
}
