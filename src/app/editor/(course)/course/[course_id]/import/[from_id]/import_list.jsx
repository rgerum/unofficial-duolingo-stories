"use client";
import styles from "../../../../edit_list.module.css";
import React from "react";
import { SpinnerBlue } from "@/components/layout/spinner";
import { useRouter } from "next/navigation";

export async function setImport(id, course_id) {
  let response_json = await fetch(
    `/editor/course/${course_id}/import/send/${id}`,
    { credentials: "include" },
  );
  let data = await response_json.json();
  return data.id;
}

export default function ImportList({ course, course_from, imports }) {
  let stories = course?.stories;
  const [importing, setImporting] = React.useState(false);
  let router = useRouter();

  async function do_import(id) {
    // prevent clicking the button twice
    if (importing) return;
    setImporting(id);

    let id2 = await setImport(id, course.id);
    await router.push("/editor/story/" + id2);
  }

  if (stories === undefined) stories = [];
  let set_ends = [];
  let last_set = 1;
  for (let story of stories) {
    if (story.set_id === last_set) set_ends.push(0);
    else set_ends.push(1);
    last_set = story.set_id;
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
            <th style={{ width: "100%" }} colSpan="2" data-js-sort-colnum="1">
              Name
            </th>
            <th data-js-sort-colnum="5" className="js-sort-active">
              Copies
            </th>
          </tr>
        </thead>
        <tbody>
          {imports.map((story, i) => (
            <tr key={story.id} className={set_ends[i] ? styles.set_start : ""}>
              <td>
                <span>
                  <b>{pad(story.set_id)}</b>&nbsp;-&nbsp;{pad(story.set_index)}
                </span>
              </td>
              <td width="44px">
                <img
                  alt={"story title"}
                  src={story.copies > 0 ? story.image_done : story.image}
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
                    title={story.duo_id}
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

function pad(x) {
  if (x < 10) return "0" + x;
  return x;
}
