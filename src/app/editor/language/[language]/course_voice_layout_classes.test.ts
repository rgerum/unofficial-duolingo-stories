import assert from "node:assert/strict";
import test from "node:test";
import { getCourseVoiceLayoutClassNames } from "./course_voice_layout_classes";

function tokens(className: string) {
  return new Set(className.split(/\s+/).filter(Boolean));
}

test("course mobile layout delegates scrolling to the outer route container", () => {
  const classNames = getCourseVoiceLayoutClassNames({
    mobileCourseLayout: true,
    selectedSection: "cast",
  });

  for (const className of [
    classNames.voices,
    classNames.voiceList,
    classNames.cast,
  ]) {
    const classTokens = tokens(className);
    assert.equal(classTokens.has("overflow-y-scroll"), false);
    assert.equal(
      [...classTokens].some((token) => token.startsWith("h-[calc(")),
      false,
    );
  }

  assert.equal(
    tokens(classNames.voices).has("min-[976px]:h-[calc(100vh-64px)]"),
    true,
  );
  assert.equal(
    tokens(classNames.voiceList).has("min-[976px]:h-[calc(100%-110px)]"),
    true,
  );
  assert.equal(
    tokens(classNames.cast).has("min-[976px]:h-[calc(100vh-64px)]"),
    true,
  );
  assert.equal(tokens(classNames.voices).has("max-[975px]:hidden"), true);
  assert.equal(tokens(classNames.cast).has("max-[975px]:hidden"), false);

  const voicesSelected = getCourseVoiceLayoutClassNames({
    mobileCourseLayout: true,
    selectedSection: "voices",
  });
  assert.equal(tokens(voicesSelected.voices).has("max-[975px]:hidden"), false);
  assert.equal(tokens(voicesSelected.cast).has("max-[975px]:hidden"), true);
});

test("generic language layout keeps its legacy inner scrolling", () => {
  const classNames = getCourseVoiceLayoutClassNames({
    mobileCourseLayout: false,
    selectedSection: "cast",
  });

  assert.equal(tokens(classNames.voices).has("overflow-y-scroll"), true);
  assert.equal(tokens(classNames.voiceList).has("overflow-y-scroll"), true);
  assert.equal(tokens(classNames.cast).has("overflow-y-scroll"), true);
});
