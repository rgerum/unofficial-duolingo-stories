import assert from "node:assert/strict";
import test from "node:test";

import { createAzureWordBoundaryMark } from "@/app/audio/_lib/audio/azure_tts";

test("createAzureWordBoundaryMark preserves valid Azure boundaries", () => {
  assert.deepEqual(
    createAzureWordBoundaryMark({
      audioOffset: 500_000,
      text: "Linda",
      textOffset: 116,
      wordLength: 5,
    }),
    {
      time: 50,
      type: "word",
      start: 116,
      end: 121,
      value: "Linda",
    },
  );
});

test("createAzureWordBoundaryMark rejects negative Azure text offsets", () => {
  const originalWarn = console.warn;
  const warnings: unknown[][] = [];
  console.warn = (...args: unknown[]) => warnings.push(args);

  try {
    assert.equal(
      createAzureWordBoundaryMark({
        audioOffset: 20_880_000,
        text: "ale  .",
        textOffset: -1,
        wordLength: 15,
      }),
      undefined,
    );
    assert.deepEqual(warnings, [
      [
        "[Azure TTS] Ignoring invalid word boundary",
        {
          audioOffset: 20_880_000,
          textOffset: -1,
          wordLength: 15,
        },
      ],
    ]);
  } finally {
    console.warn = originalWarn;
  }
});

test("createAzureWordBoundaryMark rejects non-finite Azure values", () => {
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    const baseBoundary = {
      audioOffset: 20_880_000,
      text: "ale  .",
      textOffset: 150,
      wordLength: 15,
    };

    assert.equal(
      createAzureWordBoundaryMark({
        ...baseBoundary,
        audioOffset: Number.NaN,
      }),
      undefined,
    );
    assert.equal(
      createAzureWordBoundaryMark({
        ...baseBoundary,
        textOffset: Number.NaN,
      }),
      undefined,
    );
    assert.equal(
      createAzureWordBoundaryMark({
        ...baseBoundary,
        wordLength: Number.POSITIVE_INFINITY,
      }),
      undefined,
    );
  } finally {
    console.warn = originalWarn;
  }
});
