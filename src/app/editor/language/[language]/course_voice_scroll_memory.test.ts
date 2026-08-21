import assert from "node:assert/strict";
import test from "node:test";
import { createCourseVoiceSectionScrollMemory } from "./course_voice_scroll_memory";

test("remembers an independent scroll position for each mobile voice section", () => {
  const memory = createCourseVoiceSectionScrollMemory("cast");
  const scrollTarget = { scrollTop: 420 };

  memory.remember("cast", scrollTarget);
  scrollTarget.scrollTop = 75;
  memory.remember("voices", scrollTarget);

  scrollTarget.scrollTop = 0;
  memory.restore("cast", scrollTarget);
  assert.equal(scrollTarget.scrollTop, 420);

  memory.restore("voices", scrollTarget);
  assert.equal(scrollTarget.scrollTop, 75);
});

test("an unvisited mobile voice section starts at the top", () => {
  const memory = createCourseVoiceSectionScrollMemory("cast");
  const scrollTarget = { scrollTop: 300 };

  assert.equal(memory.restorePending("cast", scrollTarget), true);
  assert.equal(scrollTarget.scrollTop, 0);

  scrollTarget.scrollTop = 300;
  memory.requestRestore("voices");
  assert.equal(memory.restorePending("voices", scrollTarget), true);

  assert.equal(scrollTarget.scrollTop, 0);
});
