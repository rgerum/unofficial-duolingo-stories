"use client";
import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { SpinnerBlue } from "@/components/ui/spinner";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { CourseImportProps } from "@/app/editor/(course)/types";

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
  const importStoryMutation = useMutation(api.storyWrite.importStory);
  const router = useRouter();

  if (
    course === undefined ||
    courseFrom === undefined ||
    imports === undefined
  ) {
    return <Spinner />;
  }

  if (!course || !courseFrom) {
    return <p>Course not found.</p>;
  }

  const courseLegacyId = course.id;

  async function do_import(id: number) {
    // prevent clicking the button twice
    if (importing) return;
    setImporting(id);

    const response = await importStoryMutation({
      sourceLegacyStoryId: id,
      targetLegacyCourseId: courseLegacyId,
      operationKey: `story:${id}:import_to:${courseLegacyId}:client`,
    });
    if (!response) {
      setImporting(undefined);
      return;
    }
    const id2 = response.id;
    await router.push("/editor/story/" + id2);
  }

  return (
    <>
      <div>
        Importing from {courseFrom.learning_language_name} (from{" "}
        {courseFrom.from_language_name}).
      </div>
      <table
        className="story_list js-sort-table js-sort-5 js-sort-desc mb-[100px] w-full border-collapse [&_a]:font-bold [&_a]:text-[var(--text-color)] [&_th]:bg-[var(--button-background)] [&_th]:px-[5px] [&_th]:pb-[5px] [&_th]:pt-[5px] [&_th]:text-left [&_th]:text-[var(--button-color)] [&_td]:px-[5px] [&_td]:py-[5px] [&_td:nth-child(2)]:w-[44px] [&_td:nth-child(2)]:min-w-[44px] [&_td:nth-child(2)]:max-w-[44px] [&_td:nth-child(2)_img]:h-[40px] [&_td:nth-child(2)_img]:w-[44px] [&_td:nth-child(2)_img]:max-w-none [&_tr:nth-child(2n)]:bg-[var(--body-background-faint)]"
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
              <td className="w-[44px] min-w-[44px] max-w-[44px]">
                <img
                  alt={"story title"}
                  src={
                    parseInt(story.copies) > 0 ? story.image_done : story.image
                  }
                  width={44}
                  height={40}
                  className="block h-[40px] w-[44px] max-w-none"
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
                    onClick={(event) => {
                      event.preventDefault();
                      void do_import(story.id);
                    }}
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
