import type { FeedbackRejectionCode } from "@convex/storyFeedback";

export type FeedbackSubmitError = {
  message: string;
  canRetry: boolean;
};

// Mobile has the same presentation map in its separate Metro root. Both maps
// are checked against the server-owned code union so protocol changes fail CI.
const serverRejectionMessages: Record<
  FeedbackRejectionCode,
  FeedbackSubmitError
> = {
  SIGN_IN_REQUIRED: {
    message: "Sign in to send feedback.",
    canRetry: false,
  },
  FEEDBACK_BLOCKED: {
    message: "Feedback submission isn’t available for this account.",
    canRetry: false,
  },
  FEEDBACK_DISABLED: {
    message: "Feedback is temporarily unavailable.",
    canRetry: false,
  },
  RATE_LIMITED: {
    message: "You’ve sent several reports recently. Please try again later.",
    canRetry: false,
  },
  STORY_REPORT_LIMIT: {
    message: "This story already has many reports. Please try again later.",
    canRetry: false,
  },
  INVALID_COMMENT: {
    message: "This feedback wasn’t accepted. Review it and try again.",
    canRetry: true,
  },
  INVALID_REQUEST: {
    message: "Feedback can’t be submitted from this story.",
    canRetry: false,
  },
  FEEDBACK_UNAVAILABLE: {
    message: "Feedback isn’t available for this story.",
    canRetry: false,
  },
};

function getServerRejectionCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return undefined;
  }
  const data = error.data;
  if (typeof data !== "object" || data === null || !("code" in data)) {
    return undefined;
  }
  return typeof data.code === "string" ? data.code : undefined;
}

function isConnectivityFailure(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /network request failed|failed to fetch|connection (?:lost|closed)|network error|offline/i.test(
    error.message,
  );
}

export function getFeedbackSubmitError(error: unknown): FeedbackSubmitError {
  const code = getServerRejectionCode(error);
  if (
    code &&
    Object.prototype.hasOwnProperty.call(serverRejectionMessages, code)
  ) {
    return serverRejectionMessages[code as FeedbackRejectionCode];
  }
  if (isConnectivityFailure(error)) {
    return {
      message: "Couldn’t connect. Check your connection and try again.",
      canRetry: true,
    };
  }
  return {
    message: "Feedback couldn’t be saved right now. Please try again later.",
    canRetry: true,
  };
}
