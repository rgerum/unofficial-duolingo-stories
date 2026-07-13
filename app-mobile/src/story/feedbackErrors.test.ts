import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import { getFeedbackSubmitError } from "./feedbackErrors";

describe("getFeedbackSubmitError", () => {
  test.each([
    ["SIGN_IN_REQUIRED", "Sign in to send feedback.", false],
    [
      "FEEDBACK_BLOCKED",
      "Feedback submission isn’t available for this account.",
      false,
    ],
    ["FEEDBACK_DISABLED", "Feedback is temporarily unavailable.", false],
    [
      "RATE_LIMITED",
      "You’ve sent several reports recently. Please try again later.",
      false,
    ],
    [
      "STORY_REPORT_LIMIT",
      "This story already has many reports. Please try again later.",
      false,
    ],
    [
      "INVALID_COMMENT",
      "This feedback wasn’t accepted. Review it and try again.",
      true,
    ],
    ["INVALID_REQUEST", "Feedback can’t be submitted from this story.", false],
    ["FEEDBACK_UNAVAILABLE", "Feedback isn’t available for this story.", false],
  ])("maps the %s server rejection", (code, message, canRetry) => {
    expect(
      getFeedbackSubmitError(
        new ConvexError({ code, reason: "Internal server detail" }),
      ),
    ).toEqual({ message, canRetry });
  });

  test.each([
    new TypeError("Network request failed"),
    new Error("Failed to fetch"),
    new Error("Connection lost while sending mutation"),
  ])("maps connectivity failures without exposing details", (error) => {
    expect(getFeedbackSubmitError(error)).toEqual({
      message: "Couldn’t connect. Check your connection and try again.",
      canRetry: true,
    });
  });

  test("hides unexpected server details", () => {
    expect(
      getFeedbackSubmitError(
        new ConvexError({ code: "NEW_SERVER_POLICY", secret: "do not show" }),
      ),
    ).toEqual({
      message: "Feedback couldn’t be saved right now. Please try again later.",
      canRetry: true,
    });
  });

  test("does not accept inherited object keys as rejection codes", () => {
    expect(
      getFeedbackSubmitError(new ConvexError({ code: "toString" })),
    ).toEqual({
      message: "Feedback couldn’t be saved right now. Please try again later.",
      canRetry: true,
    });
  });
});
