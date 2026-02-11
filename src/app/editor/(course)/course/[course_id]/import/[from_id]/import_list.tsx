"use client";
import styles from "../../../../edit_list.module.css";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { SpinnerBlue } from "@/components/layout/spinner";
import { Spinner } from "@/components/layout/spinner";
import { useRouter } from "next/navigation";
import {
  CourseImportProps,
} from "@/app/editor/(course)/types";

export async function setImport(id: number, course_id: number) {
  let response_json = await fetch(
    `/editor/course/${course_id}/import/send/${id}`,
    { credentials: "include" },
  );
  let data = await response_json.json();
  return data.id;
}

export default function ImportList({
  courseId,
  fromId,
}: {
  courseId: string;
  fromId: string;
}) {
  const course = useQuery(api.editorRead.getEditorCourseByIdentifier, {
    identifier: courseId,
  });
  const courseFrom = useQuery(api.editorRead.getEditorCourseByIdentifier, {
    identifier: fromId,
  });
  const imports = useQuery(
    api.editorRead.getEditorCourseImport,
    course && courseFrom
      ? { courseLegacyId: course.id, fromLegacyId: courseFrom.id }
      : "skip",
  );
  const [importing, setImporting] = React.useState<number | undefined>(
    undefined,
  );
  const router = useRouter();

  if (course === undefined || courseFrom === undefined || imports === undefined) {
    return <Spinner />;
  }

  if (!course || !courseFrom) {
    return <p>Course not found.</p>;
  }

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
        Importing from {courseFrom.learning_language_name} (from{" "}
        {courseFrom.from_language_name}).
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
          {(imports as CourseImportProps[]).map((story, i) => (
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
