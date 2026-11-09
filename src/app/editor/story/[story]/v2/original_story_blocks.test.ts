import assert from "node:assert/strict";
import test from "node:test";
import {
  findOriginalBlock,
  getBlockPreviewText,
  splitStoryBlocks,
} from "./original_story_blocks";

const original = `[DATA]
fromLanguageName=A Date
set=1|2

[HEADER]
> Una cita
~ a  date
$1/speech_0.mp3;2,6

[LINE]
> Julia está en una cita.
~ Julia is on   a   date

[LINE]
Speaker100: ¿Qué quieres comer?
~           what do~you~want to~eat

[MULTIPLE_CHOICE]
> Julia's date is asking...
+ … what Julia wants to eat.

[LINE]
Speaker336: Una ensalada.
~           a   salad
`;

const translated = `[DATA]
fromLanguageName=A Date
set=1|2

[HEADER]
> En date
~ a  date

[LINE]
> Julie är på en date.
~ Julie is on a  date

[LINE]
> Det är fredag.
~ it  is  Friday

[LINE]
Speaker100: Vad vill du ha att äta?
~           what do~you~want to~eat

[MULTIPLE_CHOICE]
> Julie's date is asking...
+ … what Julie wants to eat.

[LINE]<en>
Speaker336: En sallad.
~           a  salad
`;

test("splits blocks without the DATA block and trims trailing blank lines", () => {
  const blocks = splitStoryBlocks(original);
  assert.deepEqual(
    blocks.map((block) => [block.type, block.speaker, block.startLine]),
    [
      ["HEADER", "narrator", 5],
      ["LINE", "narrator", 10],
      ["LINE", "Speaker100", 14],
      ["MULTIPLE_CHOICE", "narrator", 18],
      ["LINE", "Speaker336", 22],
    ],
  );
  assert.equal(blocks[0].endLine, 8);
  assert.equal(blocks[4].endLine, 24);
});

test("matches blocks across an added line by type and speaker", () => {
  // The added narrator line has no original; the speaker line after it still
  // finds its original.
  assert.equal(findOriginalBlock(translated, original, 13)?.original, null);
  assert.equal(
    findOriginalBlock(translated, original, 17)?.original?.startLine,
    14,
  );
  assert.equal(
    findOriginalBlock(translated, original, 21)?.original?.startLine,
    18,
  );
  // Language overrides like [LINE]<en> are still LINE blocks.
  assert.equal(
    findOriginalBlock(translated, original, 25)?.original?.startLine,
    22,
  );
});

test("returns null for lines that are not block headers", () => {
  assert.equal(findOriginalBlock(translated, original, 10), null);
  assert.equal(findOriginalBlock(translated, original, 1), null);
});

test("returns only the translated block while the original is loading", () => {
  const match = findOriginalBlock(translated, null, 9);
  assert.equal(match?.translated.type, "LINE");
  assert.equal(match?.original, null);
});

test("preview text drops audio lines", () => {
  const header = splitStoryBlocks(original)[0];
  assert.equal(getBlockPreviewText(header), "[HEADER]\n> Una cita\n~ a  date");
});

test("steps through the original from a matched block", () => {
  // Translated line 17 (Speaker100) matches original block index 2.
  const auto = findOriginalBlock(translated, original, 17);
  assert.equal(auto?.autoIndex, 2);
  assert.equal(auto?.originalCount, 5);
  assert.equal(auto?.previousIndex, 1);
  assert.equal(auto?.nextIndex, 3);
  const first = findOriginalBlock(translated, original, 17, 0);
  assert.equal(first?.original?.type, "HEADER");
  assert.equal(first?.previousIndex, null);
  const last = findOriginalBlock(translated, original, 17, 4);
  assert.equal(last?.nextIndex, null);
  // A pin that no longer exists falls back to the automatic match.
  assert.equal(
    findOriginalBlock(translated, original, 17, 9)?.originalIndex,
    2,
  );
});

test("steps continuously from an unmatched block", () => {
  // The added narrator line (13) sits after the match for line 9 (index 1).
  const auto = findOriginalBlock(translated, original, 13);
  assert.equal(auto?.originalIndex, null);
  assert.equal(auto?.previousIndex, 1);
  assert.equal(auto?.nextIndex, 2);
  // Once stepped forward, stepping back continues past the start point.
  const stepped = findOriginalBlock(translated, original, 13, 2);
  assert.equal(stepped?.previousIndex, 1);
  assert.equal(stepped?.nextIndex, 3);
});
