"use client";

import React, { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import EditList from "../../edit_list";
import { Spinner } from "@/components/ui/spinner";
import type {
  DetailedCourseProps,
  StoryListDataProps,
} from "@/app/editor/(course)/types";

export default function CourseEditorPageClient({
  courseId,
}: {
  courseId: string;
}) {
  const recomputePublishedCount = useMutation(
    api.courseWrite.recomputePublishedCount,
  );
  const course = useQuery(api.editorRead.getEditorCourseByIdentifier, {
    identifier: courseId,
  });

  const stories = useQuery(api.editorRead.getEditorStoriesByCourseLegacyId, {
    identifier: courseId,
  });
  const attemptedMismatchRef = useRef<string | null>(null);

  useEffect(() => {
    if (!course || stories === undefined) return;

    const expectedPublishedCount = stories.filter(
      (story) => story.public,
    ).length;
    if (course.count === expectedPublishedCount) {
      attemptedMismatchRef.current = null;
      return;
    }

    const mismatchKey = `${course.id}:${course.count}:${expectedPublishedCount}`;
    if (attemptedMismatchRef.current === mismatchKey) return;
    attemptedMismatchRef.current = mismatchKey;

    void recomputePublishedCount({
      legacyCourseId: course.id,
    }).catch((error) => {
      console.error("Failed to recompute published story count", error);
    });
  }, [course, recomputePublishedCount, stories]);

  if (course === undefined || stories === undefined) {
    return <Spinner />;
  }

  if (!course) {
    return <p>Course not found.</p>;
  }

  return (
    <EditList
      stories={(stories ?? []) as StoryListDataProps[]}
      course={course as DetailedCourseProps}
    />
  );
}
