"use client";

const FEEDBACK_VIEW_KEY_PREFIX = "editor-feedback-view:";
const PENDING_FEEDBACK_RETURN_KEY = "editor-feedback-return-pending";
const EDITOR_SCROLL_CONTAINER_SELECTOR =
  '[data-editor-scroll-container="course-main"]';

type FeedbackViewState = {
  scrollTop: number;
  loadedReportCount: number;
};

function getScrollContainer() {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(EDITOR_SCROLL_CONTAINER_SELECTOR);
}

function getViewKey(returnHref: string) {
  return `${FEEDBACK_VIEW_KEY_PREFIX}${returnHref}`;
}

export function rememberFeedbackView(
  returnHref: string,
  loadedReportCount: number,
) {
  if (typeof window === "undefined") return;

  const scrollContainer = getScrollContainer();
  const state: FeedbackViewState = {
    scrollTop: scrollContainer?.scrollTop ?? window.scrollY,
    loadedReportCount,
  };

  window.sessionStorage.setItem(getViewKey(returnHref), JSON.stringify(state));
  window.sessionStorage.setItem(PENDING_FEEDBACK_RETURN_KEY, returnHref);
}

export function readPendingFeedbackView(
  returnHref: string,
): FeedbackViewState | null {
  if (typeof window === "undefined") return null;
  if (
    window.sessionStorage.getItem(PENDING_FEEDBACK_RETURN_KEY) !== returnHref
  ) {
    return null;
  }

  const storedValue = window.sessionStorage.getItem(getViewKey(returnHref));
  if (!storedValue) return null;

  try {
    const state = JSON.parse(storedValue) as Partial<FeedbackViewState>;
    if (
      !Number.isFinite(state.scrollTop) ||
      !Number.isInteger(state.loadedReportCount) ||
      (state.loadedReportCount ?? -1) < 0
    ) {
      return null;
    }
    return state as FeedbackViewState;
  } catch {
    return null;
  }
}

export function restorePendingFeedbackView(returnHref: string, frameCount = 8) {
  const state = readPendingFeedbackView(returnHref);
  if (!state) return () => {};

  window.sessionStorage.removeItem(PENDING_FEEDBACK_RETURN_KEY);

  const applyScroll = () => {
    const scrollContainer = getScrollContainer();
    if (scrollContainer) {
      scrollContainer.scrollTop = state.scrollTop;
    } else {
      window.scrollTo({ top: state.scrollTop, behavior: "auto" });
    }
  };

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
