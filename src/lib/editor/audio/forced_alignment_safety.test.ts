import assert from "node:assert/strict";
import test from "node:test";

import { validateAlignmentAudioFile } from "@/lib/editor/audio/forced_alignment_safety";

test("saved audio timing is rejected after the story audio file changes", () => {
  assert.equal(
    validateAlignmentAudioFile({
      resultFilename: "old-line.mp3",
      manifestFilename: "old-line.mp3",
      currentFilename: "replacement-line.mp3",
    }),
    "current audio file changed",
  );
});

test("saved audio timing is rejected when its result names another audio file", () => {
  assert.equal(
    validateAlignmentAudioFile({
      resultFilename: "unexpected-line.mp3",
      manifestFilename: "line.mp3",
      currentFilename: "line.mp3",
    }),
    "result audio file differs from manifest",
  );
});
