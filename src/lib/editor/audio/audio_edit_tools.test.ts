import assert from "node:assert/strict";
import test from "node:test";

import {
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
