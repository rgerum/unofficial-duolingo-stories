import assert from "node:assert/strict";
import test from "node:test";
import {
  createFeedbackReturnHref,
  createFeedbackStoryHref,
  parseFeedbackReturnHref,
  parseFeedbackStatus,
} from "./feedback_return_navigation";

test("builds feedback and story return links", () => {
  const returnTo = createFeedbackReturnHref("zh-HK-en", "reviewed");
  assert.equal(returnTo, "/editor/course/zh-HK-en/feedback?status=reviewed");
  assert.equal(
    createFeedbackStoryHref({
      courseShort: "zh-HK-en",
      storyId: 7309,
      line: 77,
      returnTo,
    }),
    "/editor/course/zh-HK-en/story/7309?line=77&returnTo=%2Feditor%2Fcourse%2Fzh-HK-en%2Ffeedback%3Fstatus%3Dreviewed",
  );
});

test("accepts only internal feedback return links with known statuses", () => {
  assert.equal(
    parseFeedbackReturnHref("/editor/feedback?status=open"),
    "/editor/feedback?status=open",
  );
  assert.equal(
    parseFeedbackReturnHref(
      "/editor/course/nl-en/feedback?status=not_relevant&ignored=true",
    ),
    "/editor/course/nl-en/feedback?status=not_relevant",
  );
  assert.equal(
    parseFeedbackReturnHref("https://example.com/editor/feedback?status=open"),
    undefined,
  );
  assert.equal(
    parseFeedbackReturnHref("/editor/course/nl-en?status=open"),
    undefined,
  );
  assert.equal(
    parseFeedbackReturnHref("/editor/feedback?status=unknown"),
    undefined,
  );
});

test("parses feedback status with an open fallback", () => {
  assert.equal(parseFeedbackStatus("resolved"), "resolved");
  assert.equal(parseFeedbackStatus(["spam"]), "spam");
  assert.equal(parseFeedbackStatus("unknown"), "open");
});
