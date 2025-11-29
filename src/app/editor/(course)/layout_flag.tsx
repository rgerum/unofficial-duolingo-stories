"use client";
import styles from "./layout.module.css";
import React from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import EditorButton from "../editor_button";
import { Breadcrumbs } from "../_components/breadcrumbs";

export default function LayoutFlag({ courses, languages }) {
  const segment = useSelectedLayoutSegments();
  let import_id = segment[3];
  let course = undefined;
  let course_import = undefined;

  for (let c of courses) {
    if (c.short === segment[1] || `${c.id}` === segment[1]) {
      course = c;
    }
    if (c.short === segment[3] || `${c.id}` === segment[3]) {
      course_import = c;
    }
  }
  function toggleShow() {
    const event = new Event("toggleSidebar");
    window.dispatchEvent(event);
  }
  // onClick={toggleShow}
  let path = [{ type: "Editor" }];
  if (course) {
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
  if (import_id) {
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
            <span className={styles.official} data-cy="label_official">
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
      <div className={styles.spacer}></div>
    </>
  );
}
