import assert from "node:assert/strict";
import test from "node:test";
import { getFeedbackMobileHeaderRoute } from "./layout_flag_state";

test("keeps the global Feedback header in the persistent editor layout", () => {
  assert.deepEqual(getFeedbackMobileHeaderRoute(["feedback"]), {});
});

test("keeps a Course Feedback header in the persistent editor layout", () => {
  assert.deepEqual(
    getFeedbackMobileHeaderRoute(["course", "el-en", "feedback"]),
    { courseId: "el-en" },
  );
});

test("does not claim unrelated editor routes", () => {
  assert.equal(
    getFeedbackMobileHeaderRoute(["course", "el-en", "story", "5267"]),
    null,
  );
});
