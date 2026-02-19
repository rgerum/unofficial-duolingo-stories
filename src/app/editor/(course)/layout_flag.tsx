"use client";
import React from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import EditorButton from "../editor_button";
import { Breadcrumbs } from "../_components/breadcrumbs";
import type { Id } from "@convex/_generated/dataModel";
import type { CourseProps } from "./types";

interface BreadcrumbPath {
  type: string;
  href?: string;
  name?: string;
  lang1?: {
    languageId?: Id<"languages">;
    name: string;
  };
  lang2?: {
    languageId?: Id<"languages">;
    name: string;
  };
}

export default function LayoutFlag() {
  const data = useQuery(api.editorRead.getEditorSidebarData, {});
  const courses = (data?.courses ?? []) as CourseProps[];

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
  if (course) {
    path = [
      { type: "Editor", href: `/editor` },
      { type: "sep" },
      {
        type: "course",
        lang1: {
          languageId: course.learningLanguageId,
          name: course.learning_language_name,
        },
        lang2: {
          languageId: course.fromLanguageId,
          name: course.from_language_name,
        },
      },
    ];
  }
  if (import_id && course && course_import) {
    path[path.length - 1].href = `/editor/course/${course.short}`;
    path.push({ type: "sep" });
    path.push({
      type: "course",
      name: "Import",
      lang1: {
        languageId: course_import.learningLanguageId,
        name: course_import.learning_language_name,
      },
      lang2: {
        languageId: course_import.fromLanguageId,
        name: course_import.from_language_name,
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
