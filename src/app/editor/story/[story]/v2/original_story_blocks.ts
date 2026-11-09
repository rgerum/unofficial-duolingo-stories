/**
 * Matches the blocks ([LINE], [HEADER], [MULTIPLE_CHOICE], ...) of a
 * translated story to the blocks of the official story it was translated
 * from, so the editor can show the original version of any block.
 */

export type StoryBlock = {
  type: string;
  /** Speaker of the block's first content line ("narrator" for `>` lines). */
  speaker: string | null;
  /** 1-based line number of the `[TYPE]` header line. */
  startLine: number;
  /** 1-based line number of the block's last non-empty line. */
  endLine: number;
  lines: string[];
};

const BLOCK_HEADER = /^\s*\[([A-Za-z_]+)\](<[^>]*>)?\s*$/;
const SPEAKER = /^\s*(Speaker[\w-]*)\s*:/;

/** The block type of a `[TYPE]` header line, or null for any other line. */
export function getBlockHeaderType(line: string): string | null {
  return line.match(BLOCK_HEADER)?.[1] ?? null;
}

function getSpeaker(lines: string[]): string | null {
  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith(">")) return "narrator";
    const speaker = trimmed.match(SPEAKER)?.[1];
    if (speaker) return speaker;
  }
  return null;
}

/** Splits story text into its blocks. The [DATA] block is not included. */
export function splitStoryBlocks(text: string): StoryBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: StoryBlock[] = [];
  let current: { type: string; startLine: number; lines: string[] } | null =
    null;

  const finish = () => {
    if (!current || current.type === "DATA") return;
    const blockLines = [...current.lines];
    while (blockLines.length > 1 && !blockLines.at(-1)?.trim()) {
      blockLines.pop();
    }
    blocks.push({
      type: current.type,
      speaker: getSpeaker(blockLines),
      startLine: current.startLine,
      endLine: current.startLine + blockLines.length - 1,
      lines: blockLines,
    });
  };

  lines.forEach((line, index) => {
    const type = getBlockHeaderType(line);
    if (type) {
      finish();
      current = { type, startLine: index + 1, lines: [line] };
    } else {
      current?.lines.push(line);
    }
  });
  finish();
  return blocks;
}

function matchScore(a: StoryBlock, b: StoryBlock) {
  if (a.type !== b.type) return 0;
  return a.speaker === b.speaker ? 3 : 2;
}

/**
 * Aligns translated blocks to original blocks, keeping their order. Blocks of
 * the same type pair up; matching speakers are preferred, so an added or
 * removed line shifts the alignment as little as possible. Returns, for each
 * translated block, the index of its original block or null.
 */
export function alignStoryBlocks(
  translated: StoryBlock[],
  original: StoryBlock[],
): Array<number | null> {
  const n = translated.length;
  const m = original.length;
  // score[i][j]: best alignment of translated[i..] with original[j..]
  const score: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const s = matchScore(translated[i], original[j]);
      score[i][j] = Math.max(
        s > 0 ? s + score[i + 1][j + 1] : 0,
        score[i + 1][j],
        score[i][j + 1],
      );
    }
  }

  const result: Array<number | null> = new Array(n).fill(null);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    const s = matchScore(translated[i], original[j]);
    if (s > 0 && score[i][j] === s + score[i + 1][j + 1]) {
      result[i] = j;
      i++;
      j++;
    } else if (score[i][j] === score[i + 1][j]) {
      i++;
    } else {
      j++;
    }
  }
  return result;
}

export type OriginalBlockMatch = {
  translated: StoryBlock;
  /** Index of the automatically matched original block, if any. */
  autoIndex: number | null;
  /** The original block shown, or null (no automatic match, or loading). */
  original: StoryBlock | null;
  /** Index of `original` among the original's blocks. */
  originalIndex: number | null;
  /** Number of blocks in the original (0 while loading). */
  originalCount: number;
  /** Original block index one step back / forward, or null at the ends. */
  previousIndex: number | null;
  nextIndex: number | null;
};

/**
 * Finds the original block for the translated block whose header is on
 * `lineNumber`. `pinnedIndex` is an original block the editor stepped to by
 * hand; it wins over the automatic match while it exists. Returns null when
 * that line is not a block header; without `originalText` (still loading)
 * only the translated block is set.
 */
export function findOriginalBlock(
  translatedText: string,
  originalText: string | null,
  lineNumber: number,
  pinnedIndex: number | null = null,
): OriginalBlockMatch | null {
  const translated = splitStoryBlocks(translatedText);
  const index = translated.findIndex((block) => block.startLine === lineNumber);
  if (index === -1) return null;
  if (originalText === null) {
    return {
      translated: translated[index],
      autoIndex: null,
      original: null,
      originalIndex: null,
      originalCount: 0,
      previousIndex: null,
      nextIndex: null,
    };
  }
  const original = splitStoryBlocks(originalText);
  const count = original.length;
  const aligned = alignStoryBlocks(translated, original);
  const autoIndex = aligned[index];
  const inRange = (i: number) => (i >= 0 && i < count ? i : null);

  const pinned = pinnedIndex === null ? null : inRange(pinnedIndex);
  const shown = pinned ?? autoIndex;
  let previousIndex: number | null;
  let nextIndex: number | null;
  if (shown !== null) {
    previousIndex = inRange(shown - 1);
    nextIndex = inRange(shown + 1);
  } else {
    // An unmatched block sits after the previous block's match.
    let before = -1;
    for (let i = index - 1; i >= 0; i--) {
      const match = aligned[i];
      if (match !== null) {
        before = match;
        break;
      }
    }
    previousIndex = inRange(before);
    nextIndex = inRange(before + 1);
  }
  return {
    translated: translated[index],
    autoIndex,
    original: shown === null ? null : original[shown],
    originalIndex: shown,
    originalCount: count,
    previousIndex,
    nextIndex,
  };
}

/** The lines of a block worth showing in a preview: audio lines are dropped. */
export function getBlockPreviewText(block: StoryBlock) {
  return block.lines.filter((line) => !line.trim().startsWith("$")).join("\n");
}
