import assert from "node:assert/strict";
import test from "node:test";

import {
  remove_nested_phonemes,
  synthesis_response_to_keypoints,
} from "@/lib/editor/audio/audio_timing";
import { init_mapping } from "@/lib/editor/audio/text_with_mapping";

test("remove_nested_phonemes keeps the outer phoneme and drops inner ones", () => {
  const input = init_mapping(
    '<speak><phoneme alphabet="ipa" ph="esi"><phoneme alphabet="ipa" ph="jan">jan</phoneme> Esi</phoneme> <phoneme alphabet="ipa" ph="en">en</phoneme></speak>',
  );
  const result = remove_nested_phonemes(input);
  assert.equal(
    result.text,
    '<speak><phoneme alphabet="ipa" ph="esi">jan Esi</phoneme> <phoneme alphabet="ipa" ph="en">en</phoneme></speak>',
  );
  assert.equal(result.mapping.length, result.text.length);
});

test("remove_nested_phonemes leaves non-nested phonemes untouched", () => {
  const text =
    '<phoneme alphabet="ipa" ph="jan">jan</phoneme> <phoneme alphabet="ipa" ph="pona">pona</phoneme>';
  const result = remove_nested_phonemes(init_mapping(text));
  assert.equal(result.text, text);
});

test("remove_nested_phonemes handles doubly nested phonemes", () => {
  const result = remove_nested_phonemes(
    init_mapping(
      '<phoneme ph="a"><phoneme ph="b"><phoneme ph="c">x</phoneme> y</phoneme> z</phoneme>',
    ),
  );
  assert.equal(result.text, '<phoneme ph="a">x y z</phoneme>');
});

test("synthesis_response_to_keypoints converts google timepoints", () => {
  assert.deepEqual(
    synthesis_response_to_keypoints({
      timepoints: [
        { markName: "3", timeSeconds: 0.05 },
        { markName: "8", timeSeconds: 0.42 },
      ],
    }),
    [
      { rangeEnd: 3, audioStart: 50 },
      { rangeEnd: 8, audioStart: 420 },
    ],
  );
});

test("synthesis_response_to_keypoints converts marks through the mapping", () => {
  assert.deepEqual(
    synthesis_response_to_keypoints(
      {
        marks: [
          { time: 10, end: 5 },
          { time: 200, end: 9 },
        ],
      },
      { 5: 3, 9: 8 },
    ),
    [
      { rangeEnd: 3, audioStart: 10 },
      { rangeEnd: 8, audioStart: 200 },
    ],
  );
});
