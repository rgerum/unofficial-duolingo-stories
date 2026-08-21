"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export function useCoursePin(courseId: number) {
  const pinnedCourseIds = useQuery(api.coursePins.listCurrentUserPins, {});
  const setCoursePin = useMutation(api.coursePins.setCurrentUserCoursePin);
  const [isUpdating, setIsUpdating] = useState(false);
  const isPinned = pinnedCourseIds?.includes(courseId) ?? false;

  async function toggle() {
    if (isUpdating || pinnedCourseIds === undefined) return;
    setIsUpdating(true);
    try {
      await setCoursePin({
        courseLegacyId: courseId,
        pinned: !isPinned,
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return {
    isPinned,
    isUpdating,
    isLoading: pinnedCourseIds === undefined,
    toggle,
  };
}
