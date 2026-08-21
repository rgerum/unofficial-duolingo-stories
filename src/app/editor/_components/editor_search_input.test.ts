import assert from "node:assert/strict";
import test from "node:test";
import { editorSearchInputClassName } from "./editor_search_input";

test("keeps mobile editor searches at an iOS-safe focus size", () => {
  assert.match(editorSearchInputClassName, /max-\[975px\]:!text-\[16px\]/);
});
