"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import EditList from "../../edit_list";
import { Spinner } from "@/components/layout/spinner";
import type { CourseProps, StoryListDataProps } from "@/app/editor/(course)/types";

export default function CourseEditorPageClient({
  courseId,
}: {
  courseId: string;
}) {
  const course = useQuery(api.editorRead.getEditorCourseByIdentifier, {
    identifier: courseId,
  });

  const stories = useQuery(
    api.editorRead.getEditorStoriesByCourseLegacyId,
    course ? { courseLegacyId: course.id } : "skip",
  );

  if (course === undefined || stories === undefined) {
    return <Spinner />;
  }

  if (!course) {
    return <p>Course not found.</p>;
  }

  return (
    <EditList
      stories={(stories ?? []) as StoryListDataProps[]}
      course={course as CourseProps}
    />
  );
}

