"use client";

const COURSE_SCROLL_KEY_PREFIX = "editor-course-scroll:";
const COURSE_FILTER_KEY_PREFIX = "editor-course-filter:";
const COURSE_SCROLL_CONTAINER_SELECTOR =
  '[data-editor-scroll-container="course-main"]';
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

function getCourseScrollContainer() {
  if (typeof document === "undefined") return null;

  return document.querySelector<HTMLElement>(COURSE_SCROLL_CONTAINER_SELECTOR);
}

export function rememberCourseScrollPosition(courseIdentifier: string) {
  if (typeof window === "undefined") return;

  const scrollContainer = getCourseScrollContainer();
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

  const applyScroll = () => {
    const scrollContainer = getCourseScrollContainer();
    if (scrollContainer) {
      scrollContainer.scrollTop = storedScrollPosition;
    } else {
      window.scrollTo({
        top: storedScrollPosition,
        behavior: "auto",
      });
    }
  };

  // Apply immediately so a layout effect can restore before the first paint.
  applyScroll();

  let isCancelled = false;
  let animationFrameId: number | null = null;
  let remainingFrames = frameCount - 1;
  const keepScrollApplied = () => {
    if (isCancelled) return;

    applyScroll();
    remainingFrames -= 1;
    if (remainingFrames > 0) {
      animationFrameId = window.requestAnimationFrame(keepScrollApplied);
    }
  };

  if (remainingFrames > 0) {
    animationFrameId = window.requestAnimationFrame(keepScrollApplied);
  }

  return () => {
    isCancelled = true;
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
    }
  };
}

function isCourseFilterValue(value: string): value is CourseFilterValue {
  return COURSE_FILTER_VALUES.includes(value as CourseFilterValue);
}
