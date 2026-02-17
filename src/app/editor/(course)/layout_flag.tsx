"use client";
import React from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import EditorButton from "../editor_button";
import { Breadcrumbs } from "../_components/breadcrumbs";
import type { CourseProps, LanguageProps } from "./types";

interface BreadcrumbPath {
  type: string;
  href?: string;
  name?: string;
  lang1?: {
    short: string;
    name: string;
    flag: number | null;
    flag_file: string | null;
  };
  lang2?: {
    short: string;
    name: string;
    flag: number | null;
    flag_file: string | null;
  };
}

export default function LayoutFlag() {
  const data = useQuery(api.editorRead.getEditorSidebarData, {});
  const courses = (data?.courses ?? []) as CourseProps[];
  const languagesArray = (data?.languages ?? []) as LanguageProps[];
  const languages: Record<string | number, LanguageProps> = {};
  for (const language of languagesArray) {
    languages[language.id] = language;
    languages[language.short] = language;
  }

  const segment = useSelectedLayoutSegments();
  let import_id = segment[3];
  let course: CourseProps | undefined = undefined;
  let course_import: CourseProps | undefined = undefined;

  for (let c of courses) {
    if (c.short === segment[1] || `${c.id}` === segment[1]) {
      course = c;
    }
    if (c.short === segment[3] || `${c.id}` === segment[3]) {
      course_import = c;
    }
  }
  let path: BreadcrumbPath[] = [{ type: "Editor" }];
  if (course && languages[course.learning_language] && languages[course.from_language]) {
    path = [
      { type: "Editor", href: `/editor` },
      { type: "sep" },
      {
        type: "course",
        lang1: {
          short: languages[course.learning_language].short,
          name: course.learning_language_name,
          flag: languages[course.learning_language].flag,
          flag_file: languages[course.learning_language].flag_file,
        },
        lang2: {
          short: languages[course.from_language].short,
          name: course.from_language_name,
          flag: languages[course.from_language].flag,
          flag_file: languages[course.from_language].flag_file,
        },
      },
    ];
  }
  if (
    import_id &&
    course &&
    course_import &&
    languages[course_import.learning_language] &&
    languages[course_import.from_language]
  ) {
    path[path.length - 1].href = `/editor/course/${course.short}`;
    path.push({ type: "sep" });
    path.push({
      type: "course",
      name: "Import",
      lang1: {
        short: languages[course_import.learning_language].short,
        name: course_import.learning_language_name,
        flag: languages[course_import.learning_language].flag,
        flag_file: languages[course_import.learning_language].flag_file,
      },
      lang2: {
        short: languages[course_import.from_language].short,
        name: course_import.from_language_name,
        flag: languages[course_import.from_language].flag,
        flag_file: languages[course_import.from_language].flag_file,
      },
    });
  }
  return (
    <>
      <Breadcrumbs path={path} />
      <div style={{ marginLeft: "auto" }}></div>
      {course ? (
        <>
          {course.official ? (
            <span className="pr-[15px]" data-cy="label_official">
              <i>official</i>
            </span>
          ) : !import_id ? (
            <EditorButton
              id="button_import"
              href={`/editor/course/${course.short}/import/es-en`}
              data-cy="button_import"
              img={"import.svg"}
              text={"Import"}
            />
          ) : (
            <EditorButton
              id="button_back"
              href={`/editor/course/${course.short}`}
              data-cy="button_back"
              img={"back.svg"}
              text={"Back"}
            />
          )}
        </>
      ) : (
        ""
      )}
      <div className="ml-[50px] max-[1120px]:ml-0"></div>
    </>
  );
}
