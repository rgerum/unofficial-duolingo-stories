"use client";
import styles from "./layout.module.css";
import React from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import EditorButton from "../editor_button";
import { Breadcrumbs } from "../_components/breadcrumbs";

export default function LayoutFlag({ courses }) {
  const segment = useSelectedLayoutSegments();
  let import_id = segment[3];
  let course = undefined;

  for (let c of courses) {
    if (c.short === segment[1] || `${c.id}` === segment[1]) {
      course = c;
      break;
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
          short: course.learning_language,
          name: course.learning_language_name,
          flag: course.learning_language_flag,
          flag_file: course.learning_language_flag_file,
        },
        lang2: {
          short: course.from_language,
          name: course.from_language_name,
          flag: course.from_language_flag,
          flag_file: course.from_language_flag_file,
        },
      },
    ];
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
