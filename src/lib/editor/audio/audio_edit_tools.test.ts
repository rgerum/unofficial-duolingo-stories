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

test("timings_to_text supports timing-only output for shared editor use", () => {
  assert.equal(
    timings_to_text({
      filename: "",
      keypoints: [
        { rangeEnd: 5, audioStart: 50 },
        { rangeEnd: 11, audioStart: 488 },
      ],
    }),
    ";5,50;6,438",
  );
});

test("timings_to_text rejects non-finite keypoints instead of serializing NaN", () => {
  assert.throws(
    () =>
      timings_to_text({
        filename: "example.mp3",
        keypoints: [{ rangeEnd: Number.NaN, audioStart: 10 }],
      }),
    {
      name: "RangeError",
      message: "Invalid audio keypoint at index 0: rangeEnd=NaN, audioStart=10",
    },
  );
});

test("timings_to_text rejects unsafe integers instead of exponential notation", () => {
  assert.throws(
    () =>
      timings_to_text({
        filename: "example.mp3",
        keypoints: [{ rangeEnd: 1e21, audioStart: 10 }],
      }),
    {
      name: "RangeError",
      message:
        "Invalid audio keypoint at index 0: rangeEnd=1e+21, audioStart=10",
    },
  );
});

test("timings_to_text rejects keypoints that move backward", () => {
  assert.throws(
    () =>
      timings_to_text({
        filename: "example.mp3",
        keypoints: [
          { rangeEnd: 5, audioStart: 50 },
          { rangeEnd: 4, audioStart: 60 },
        ],
      }),
    {
      name: "RangeError",
      message:
        "Non-monotonic audio keypoint at index 1: rangeEnd=4 after 5, audioStart=60 after 50",
    },
  );
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

test("generate_audio_line reports Azure marks that move backward in the source text", async () => {
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
    await assert.rejects(() => generate_audio_line({ ...ssml, id: 8604 }), {
      name: "RangeError",
      message:
        "Invalid speech mark at index 6: rangeEnd=0 after 33, audioStart=2088 after 2063",
    });
  } finally {
    globalThis.Request = originalRequest;
    globalThis.fetch = originalFetch;
  }
});

test("generate_audio_line maps Polly UTF-8 byte speech marks to source text", async () => {
  const originalRequest = globalThis.Request;
  const originalFetch = globalThis.fetch;
  const source = "Но,  я   обожаю      овощи      и   особенно   помидоры!";
  const hiddenStart = source.indexOf("помидоры");
  const ssml = generate_ssml_line(
    { speaker: "Tatyana", text: source },
    undefined as never,
    [{ start: hiddenStart, end: hiddenStart + "помидоры".length }],
    [],
  );

  globalThis.Request = class {} as unknown as typeof Request;
  globalThis.fetch = (async () => ({
    json: async () => ({
      output_file: "900/16a0effa.mp3",
      engine: "polly",
      marks: [
        { time: 6, type: "word", start: 7, end: 11, value: "Но" },
        { time: 562, type: "word", start: 14, end: 16, value: "я" },
        { time: 807, type: "word", start: 19, end: 31, value: "обожаю" },
        { time: 1395, type: "word", start: 37, end: 47, value: "овощи" },
        { time: 1786, type: "word", start: 53, end: 55, value: "и" },
        {
          time: 1811,
          type: "word",
          start: 58,
          end: 74,
          value: "особенно",
        },
        {
          time: 2240,
          type: "word",
          start: 102,
          end: 118,
          value: "помидоры",
        },
      ],
    }),
  })) as unknown as typeof fetch;

  try {
    const result = await generate_audio_line({ ...ssml, id: 900 });
    assert.deepEqual(result.keypoints.at(-1), {
      rangeEnd: hiddenStart + "помидоры".length,
      audioStart: 2240,
    });
  } finally {
    globalThis.Request = originalRequest;
    globalThis.fetch = originalFetch;
  }
});

test("generate_audio_line rejects null numeric values from JSON speech marks", async () => {
  const originalRequest = globalThis.Request;
  const originalFetch = globalThis.fetch;
  globalThis.Request = class {} as unknown as typeof Request;
  globalThis.fetch = (async () => ({
    json: async () => ({
      output_file: "example.mp3",
      marks: [{ time: null, start: null, end: null, value: "word" }],
    }),
  })) as unknown as typeof fetch;

  try {
    await assert.rejects(
      () =>
        generate_audio_line({
          speaker: "cs-CZ-AntoninNeural",
          text: "word",
          id: 0,
          mapping: [0],
        }),
      {
        name: "RangeError",
        message: "Invalid speech mark at index 0: end=null, time=null",
      },
    );
  } finally {
    globalThis.Request = originalRequest;
    globalThis.fetch = originalFetch;
  }
});

test("generate_audio_line rejects negative first speech-mark keypoints", async () => {
  const originalRequest = globalThis.Request;
  const originalFetch = globalThis.fetch;
  let marks = [{ time: 0, end: 0, value: "word" }];
  globalThis.Request = class {} as unknown as typeof Request;
  globalThis.fetch = (async () => ({
    json: async () => ({
      output_file: "example.mp3",
      marks,
    }),
  })) as unknown as typeof fetch;

  try {
    await assert.rejects(
      () =>
        generate_audio_line({
          speaker: "cs-CZ-AntoninNeural",
          text: "word",
          id: 0,
          mapping: [-1],
        }),
      {
        name: "RangeError",
        message:
          "Invalid speech mark at index 0: rangeEnd=-1 after 0, audioStart=0 after 0",
      },
    );

    marks = [{ time: -1, end: 0, value: "word" }];
    await assert.rejects(
      () =>
        generate_audio_line({
          speaker: "cs-CZ-AntoninNeural",
          text: "word",
          id: 0,
          mapping: [0],
        }),
      {
        name: "RangeError",
        message:
          "Invalid speech mark at index 0: rangeEnd=0 after 0, audioStart=-1 after 0",
      },
    );
  } finally {
    globalThis.Request = originalRequest;
    globalThis.fetch = originalFetch;
  }
});
