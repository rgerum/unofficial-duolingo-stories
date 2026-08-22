import assert from "node:assert/strict";
import test from "node:test";
import { isCourseStoryListRoute } from "./route_loading_state";

test("uses the Story List loading shell for an exact Course route", () => {
  assert.equal(isCourseStoryListRoute(["course", "nl-en"]), true);
});

test("does not show the Story List loading shell for nested Course routes", () => {
  assert.equal(isCourseStoryListRoute(["course", "nl-en", "voices"]), false);
  assert.equal(
    isCourseStoryListRoute(["course", "nl-en", "story", "43"]),
    false,
  );
});

test("does not show the Story List loading shell outside Course routes", () => {
  assert.equal(isCourseStoryListRoute([]), false);
  assert.equal(isCourseStoryListRoute(["feedback"]), false);
});
