"use client";

import {
  getEditorMainScrollContainer,
  restoreEditorScrollPosition,
} from "@/app/editor/_components/editor_scroll_container";

const FEEDBACK_VIEW_KEY_PREFIX = "editor-feedback-view:";
const PENDING_FEEDBACK_RETURN_KEY = "editor-feedback-return-pending";

type FeedbackViewState = {
  scrollTop: number;
  loadedReportCount: number;
};

function getViewKey(returnHref: string) {
  return `${FEEDBACK_VIEW_KEY_PREFIX}${returnHref}`;
}

export function rememberFeedbackView(
  returnHref: string,
  loadedReportCount: number,
) {
  if (typeof window === "undefined") return;

  const scrollContainer = getEditorMainScrollContainer();
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

  return restoreEditorScrollPosition(state.scrollTop, frameCount);
}
