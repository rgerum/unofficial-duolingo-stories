import assert from "node:assert/strict";
import test from "node:test";
import { getLintPanelClassName } from "./lint_panel";
import { mobileEditorTheme } from "./mobile_editor_presentation";

test("mobile Story Editor can scroll the final source row above the keyboard", () => {
  assert.equal(mobileEditorTheme[".cm-content"].paddingBottom, "50vh");
});

test("mobile Story checks leave the editing area while source text is focused", () => {
  assert.match(getLintPanelClassName(true), /max-\[975px\]:hidden/);
  assert.doesNotMatch(getLintPanelClassName(false), /max-\[975px\]:hidden/);
});
