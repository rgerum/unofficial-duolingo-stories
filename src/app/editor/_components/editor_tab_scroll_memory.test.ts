import assert from "node:assert/strict";
import test from "node:test";
import { createEditorTabScrollMemory } from "./editor_tab_scroll_memory";

test("remembers independent positions for any editor tab set", () => {
  const memory = createEditorTabScrollMemory<"rules" | "test">("rules");
  const scrollTarget = { scrollTop: 360 };

  memory.remember("rules", scrollTarget);
  scrollTarget.scrollTop = 80;
  memory.remember("test", scrollTarget);

  scrollTarget.scrollTop = 0;
  memory.restore("rules", scrollTarget);
  assert.equal(scrollTarget.scrollTop, 360);

  memory.restore("test", scrollTarget);
  assert.equal(scrollTarget.scrollTop, 80);
});

test("starts the initial and unvisited editor tabs at the top", () => {
  const memory = createEditorTabScrollMemory<"cast" | "voices">("cast");
  const scrollTarget = { scrollTop: 300 };

  assert.equal(memory.restorePending("cast", scrollTarget), true);
  assert.equal(scrollTarget.scrollTop, 0);

  scrollTarget.scrollTop = 300;
  memory.requestRestore("voices");
  assert.equal(memory.restorePending("voices", scrollTarget), true);
  assert.equal(scrollTarget.scrollTop, 0);
});
