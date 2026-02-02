"use client";
import styles from "../../../../edit_list.module.css";
import React from "react";
import { SpinnerBlue } from "@/components/layout/spinner";
import { useRouter } from "next/navigation";
import {
  CourseImportProps,
  CourseProps,
} from "@/app/editor/(course)/db_get_course_editor_convex";

export async function setImport(id: number, course_id: number) {
  let response_json = await fetch(
    `/editor/course/${course_id}/import/send/${id}`,
    { credentials: "include" },
  );
  let data = await response_json.json();
  return data.id;
}

export default function ImportList({
  course,
  course_from,
  imports,
}: {
  course: CourseProps;
  course_from: CourseProps;
  imports: CourseImportProps[];
}) {
  const [importing, setImporting] = React.useState<number | undefined>(
    undefined,
  );
  const router = useRouter();

  async function do_import(id: number) {
    // prevent clicking the button twice
    if (importing) return;
    setImporting(id);

    let id2 = await setImport(id, course.id);
    await router.push("/editor/story/" + id2);
  }

  return (
    <>
      <div>
        Importing from {course_from.learning_language_name} (from{" "}
        {course_from.from_language_name}).
      </div>
      <table
        className={styles.story_list + " js-sort-table js-sort-5 js-sort-desc"}
        data-cy="story_list"
        data-js-sort-table="true"
      >
        <thead>
          <tr>
            <th data-js-sort-colnum="0">Set</th>
            <th style={{ width: "100%" }} colSpan={2} data-js-sort-colnum="1">
              Name
            </th>
            <th data-js-sort-colnum="5" className="js-sort-active">
              Copies
            </th>
          </tr>
        </thead>
        <tbody>
          {imports.map((story, i) => (
            <tr key={story.id} className={""}>
              <td>
                <span>
                  <b>{pad(story.set_id)}</b>&nbsp;-&nbsp;{pad(story.set_index)}
                </span>
              </td>
              <td width="44px">
                <img
                  alt={"story title"}
                  src={
                    parseInt(story.copies) > 0 ? story.image_done : story.image
                  }
                  width="44px"
                  height={"40px"}
                />
              </td>
              <td style={{ width: "100%" }}>
                {importing === story.id ? (
                  <span>
                    Importing <SpinnerBlue />
                  </span>
                ) : (
                  <a
                    href={`#`}
                    title={story.name}
                    onClick={() => do_import(story.id)}
                  >
                    {story.name}
                  </a>
                )}
              </td>
              <td>{story.copies}x</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function pad(x: number) {
  if (x < 10) return "0" + x;
  return x.toString();
}
