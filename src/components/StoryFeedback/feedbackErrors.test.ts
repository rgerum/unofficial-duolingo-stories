import assert from "node:assert/strict";
import test from "node:test";
import { ConvexError } from "convex/values";
import type { FeedbackRejectionCode } from "@convex/storyFeedback";
import { getFeedbackSubmitError as getMobileFeedbackSubmitError } from "../../../app-mobile/src/story/feedbackErrors";
import { getFeedbackSubmitError } from "./feedbackErrors";

const rejectionCodes: Array<FeedbackRejectionCode> = [
  "SIGN_IN_REQUIRED",
  "FEEDBACK_BLOCKED",
  "FEEDBACK_DISABLED",
  "RATE_LIMITED",
  "STORY_REPORT_LIMIT",
  "INVALID_COMMENT",
  "INVALID_REQUEST",
  "FEEDBACK_UNAVAILABLE",
];

test("web and mobile keep rejection presentation policy in sync", () => {
  for (const code of rejectionCodes) {
    const error = new ConvexError({ code });
    assert.deepEqual(
      getFeedbackSubmitError(error),
      getMobileFeedbackSubmitError(error),
      code,
    );
  }
});

test("maps terminal policy rejections without exposing server details", () => {
  assert.deepEqual(
    getFeedbackSubmitError(
      new ConvexError({
        code: "FEEDBACK_BLOCKED",
        reason: "private moderation note",
      }),
    ),
    {
      message: "Feedback submission isn’t available for this account.",
      canRetry: false,
    },
  );
});

test("keeps comment validation retryable", () => {
  assert.deepEqual(
    getFeedbackSubmitError(new ConvexError({ code: "INVALID_COMMENT" })),
    {
      message: "This feedback wasn’t accepted. Review it and try again.",
      canRetry: true,
    },
  );
});

test("maps connectivity failures separately", () => {
  assert.deepEqual(
    getFeedbackSubmitError(new TypeError("Network request failed")),
    {
      message: "Couldn’t connect. Check your connection and try again.",
      canRetry: true,
    },
  );
});

test("hides unexpected rejection data", () => {
  assert.deepEqual(
    getFeedbackSubmitError(
      new ConvexError({ code: "toString", reason: "do not show" }),
    ),
    {
      message: "Feedback couldn’t be saved right now. Please try again later.",
      canRetry: true,
    },
  );
});
