import assert from "node:assert/strict";
import test from "node:test";
import { getCourseSegment, shouldShowCourseList } from "./sidebar_state";

test("keeps the mobile course list hidden on the learner-interest route", () => {
  const segments = ["interest"];

  assert.equal(getCourseSegment(segments), undefined);
  assert.equal(shouldShowCourseList(segments), false);
});

test("shows the course list on the editor root", () => {
  assert.equal(shouldShowCourseList([]), true);
});

test("hides the mobile course list on a course route", () => {
  const segments = ["course", "da-en"];

  assert.equal(getCourseSegment(segments), "da-en");
  assert.equal(shouldShowCourseList(segments), false);
});
