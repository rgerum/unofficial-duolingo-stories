import assert from "node:assert/strict";
import test from "node:test";

import { createAzureWordBoundaryMark } from "./azure_tts";

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
  assert.equal(
    createAzureWordBoundaryMark({
      audioOffset: 20_880_000,
      text: "ale  .",
      textOffset: -1,
      wordLength: 15,
    }),
    undefined,
  );
});
