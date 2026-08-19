import assert from "node:assert/strict";
import test from "node:test";
import { getCourseSegment, shouldShowCourseList } from "./swipe_state";

test("keeps the mobile course list closed on the learner-interest route", () => {
  const segments = ["interest"];

  assert.equal(getCourseSegment(segments), undefined);
  assert.equal(shouldShowCourseList(segments, false), false);
});

test("shows the course list on the editor root", () => {
  assert.equal(shouldShowCourseList([], false), true);
});

test("uses the toggled drawer state on a course route", () => {
  const segments = ["course", "da-en"];

  assert.equal(getCourseSegment(segments), "da-en");
  assert.equal(shouldShowCourseList(segments, false), false);
  assert.equal(shouldShowCourseList(segments, true), true);
});
