import assert from "node:assert/strict";
import test from "node:test";
import {
  STORY_LIST_ILLUSTRATION_SIZE,
  storyListFilterCountClassName,
  storyListSkeletonIllustrationClassName,
} from "./story_list_layout";

function classTokens(className: string) {
  return new Set(className.split(/\s+/));
}

test("loading rows reserve the same illustration dimensions as loaded rows", () => {
  const tokens = classTokens(storyListSkeletonIllustrationClassName);

  assert.equal(
    tokens.has(`h-[${STORY_LIST_ILLUSTRATION_SIZE.height}px]`),
    true,
  );
  assert.equal(tokens.has("w-11"), true);
});

test("filter counts reserve a stable mobile width while loading", () => {
  assert.equal(
    classTokens(storyListFilterCountClassName).has("max-[975px]:min-w-9"),
    true,
  );
});
