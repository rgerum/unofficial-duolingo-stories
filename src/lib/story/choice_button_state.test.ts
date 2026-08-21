import assert from "node:assert/strict";
import test from "node:test";
import {
  createChoiceButtonStates,
  selectChoiceButton,
} from "./choice_button_state";

test("selecting the correct choice completes its unselected siblings", () => {
  let states = createChoiceButtonStates(3);
  states = selectChoiceButton(states, 1, 0);
  states = selectChoiceButton(states, 1, 1);

  assert.deepEqual(states, ["false", "right", "done"]);
  assert.equal(selectChoiceButton(states, 1, 2), states);
});
