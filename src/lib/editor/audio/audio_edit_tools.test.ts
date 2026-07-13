import assert from "node:assert/strict";
import test from "node:test";

import { Text } from "@codemirror/state";
import {
  get_audio_insert_line,
  timing_text_without_filename,
  timings_to_text,
} from "@/lib/editor/audio/audio_edit_tools";

test("timing_text_without_filename keeps only timing deltas", () => {
  assert.equal(
    timing_text_without_filename("$audio/1961/_f34f3b72.mp3;2,132768;7,127"),
    ";2,132768;7,127",
  );
});

test("timing_text_without_filename prevents duplicate audio filenames on save", () => {
  const existingTimingText = timings_to_text({
    filename: "audio/1961/_399e4cc6.mp3",
    keypoints: [
      { rangeEnd: 2, audioStart: 132768 },
      { rangeEnd: 9, audioStart: 132895 },
    ],
  });

  const savedText = `$1961/_f34f3b72.mp3${timing_text_without_filename(
    existingTimingText,
  )}`;

  assert.equal(savedText, "$1961/_f34f3b72.mp3;2,132768;7,127");
});

test("get_audio_insert_line targets the next syntax line", () => {
  const doc = Text.of([
    "[SELECT_PHRASE]",
    "> Select the missing phrase",
    "Speaker856: [Δεν~ξέρω], νομίζω πως~ναι.",
    "~ I~don't~know  I~think so",
    "+ Δεν ξέρω",
  ]);

  const line = get_audio_insert_line(doc, 5);

  assert.equal(line.number, 5);
  assert.equal(line.text, "+ Δεν ξέρω");
});
