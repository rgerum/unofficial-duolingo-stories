"use client";

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useRef } from "react";
import type {
  DetailedCourseProps,
  StoryListDataProps,
} from "@/app/editor/(course)/types";
import { Spinner } from "@/components/ui/spinner";
import EditList from "../../edit_list";
import StoryListLoading from "../../story_list_loading";

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
    return (
      <>
        <div className="min-[976px]:hidden">
          <StoryListLoading />
        </div>
        <div className="hidden min-[976px]:block">
          <Spinner />
        </div>
      </>
    );
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
