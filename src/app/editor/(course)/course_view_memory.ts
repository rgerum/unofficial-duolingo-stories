"use client";

import {
  getEditorMainScrollContainer,
  restoreEditorScrollPosition,
} from "@/app/editor/_components/editor_scroll_container";

const COURSE_SCROLL_KEY_PREFIX = "editor-course-scroll:";
const COURSE_FILTER_KEY_PREFIX = "editor-course-filter:";
const COURSE_FILTER_VALUES = [
  "all",
  "draft",
  "feedback",
  "finished",
  "published",
] as const;

type CourseFilterValue = (typeof COURSE_FILTER_VALUES)[number];

function getCourseScrollKey(courseIdentifier: string) {
  return `${COURSE_SCROLL_KEY_PREFIX}${courseIdentifier}`;
}

function getCourseFilterKey(courseIdentifier: string) {
  return `${COURSE_FILTER_KEY_PREFIX}${courseIdentifier}`;
}

export function rememberCourseScrollPosition(courseIdentifier: string) {
  if (typeof window === "undefined") return;

  const scrollContainer = getEditorMainScrollContainer();
  const scrollTop = scrollContainer?.scrollTop ?? window.scrollY;

  window.sessionStorage.setItem(
    getCourseScrollKey(courseIdentifier),
    String(scrollTop),
  );
}

export function readCourseScrollPosition(courseIdentifier: string) {
  if (typeof window === "undefined") return null;

  const storageKey = getCourseScrollKey(courseIdentifier);
  const storedValue = window.sessionStorage.getItem(storageKey);
  if (storedValue === null) return null;

  const scrollPosition = Number(storedValue);
  if (!Number.isFinite(scrollPosition)) return null;

  return scrollPosition;
}

export function rememberCourseFilter(
  courseIdentifier: string,
  filter: CourseFilterValue,
) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(getCourseFilterKey(courseIdentifier), filter);
}

export function readCourseFilter(
  courseIdentifier: string,
): CourseFilterValue | null {
  if (typeof window === "undefined") return null;

  const storedFilter = window.sessionStorage.getItem(
    getCourseFilterKey(courseIdentifier),
  );
  if (storedFilter === null) return null;

  return isCourseFilterValue(storedFilter) ? storedFilter : null;
}

export function restoreCourseScrollPosition(
  courseIdentifier: string,
  frameCount = 8,
) {
  const storedScrollPosition = readCourseScrollPosition(courseIdentifier);
  if (storedScrollPosition === null) return () => {};

  return restoreEditorScrollPosition(storedScrollPosition, frameCount);
}

function isCourseFilterValue(value: string): value is CourseFilterValue {
  return COURSE_FILTER_VALUES.includes(value as CourseFilterValue);
}
