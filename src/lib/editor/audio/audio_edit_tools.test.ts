import assert from "node:assert/strict";
import test from "node:test";

import { Text } from "@codemirror/state";
import {
  generate_audio_line,
  generate_ssml_line,
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

test("generate_audio_line ignores Azure marks that move backward in the source text", async () => {
  const originalRequest = globalThis.Request;
  const originalFetch = globalThis.fetch;
  const source = "Linda utíká na zastávku autobusu, ale je moc pozdě.";
  const hiddenStart = source.indexOf("je moc pozdě");
  const ssml = generate_ssml_line(
    { speaker: "cs-CZ-AntoninNeural", text: source },
    undefined as never,
    [{ start: hiddenStart, end: hiddenStart + "je moc pozdě".length }],
    [],
  );

  globalThis.Request = class {} as unknown as typeof Request;
  globalThis.fetch = (async () => ({
    json: async () => ({
      output_file: "8604/951ddb2a.mp3",
      marks: [
        { time: 50, start: 116, end: 121, value: "Linda" },
        { time: 488, start: 122, end: 127, value: "utíká" },
        { time: 913, start: 128, end: 130, value: "na" },
        { time: 1000, start: 131, end: 139, value: "zastávku" },
        { time: 1475, start: 140, end: 148, value: "autobusu" },
        { time: 2063, start: 148, end: 149, value: "," },
        { time: 2088, start: -1, end: 14, value: "ale  ." },
      ],
    }),
  })) as unknown as typeof fetch;

  try {
    const generated = await generate_audio_line({ ...ssml, id: 8604 });

    assert.equal(
      timings_to_text(generated),
      "$8604/951ddb2a.mp3;5,50;6,438;3,425;9,87;9,475;1,588",
    );
  } finally {
    globalThis.Request = originalRequest;
    globalThis.fetch = originalFetch;
  }
});
