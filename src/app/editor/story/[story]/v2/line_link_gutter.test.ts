import assert from "node:assert/strict";
import test from "node:test";
import { buildStoryLineLink } from "./line_link_gutter";

test("line link points to the current editor page with only the line param", () => {
  assert.equal(
    buildStoryLineLink(
      "https://duostories.org/editor/course/zh-HK-en/story/7309?line=3&returnTo=%2Feditor%2Ffeedback#x",
      77,
    ),
    "https://duostories.org/editor/course/zh-HK-en/story/7309?line=77",
  );
});

test("line link adds the line param when none is present", () => {
  assert.equal(
    buildStoryLineLink("http://localhost:3000/editor/course/es-en/story/1", 5),
    "http://localhost:3000/editor/course/es-en/story/1?line=5",
  );
});
