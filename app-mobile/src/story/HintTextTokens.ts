import type { ContentWithHints, HideRange } from "./types";

export type Token = {
  text: string;
  start: number;
  hidden: boolean;
  hiddenGroupKey?: string;
  revealed: boolean;
  dimmed: boolean;
  hint?: { translation: string; pronunciation?: string };
  hintGroupKey?: string;
};

function splitTextTokens(text: string): string[] {
  if (!text) return [];
  return text
    .split(/([\s\\¡!"#$%&*,./:;<=>¿?@^_`{|}]+)/)
    .filter((p) => p !== "");
}

function getOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): boolean {
  if (start2 === end2) return false;
  if (start2 === undefined || end2 === undefined) return false;
  if (start1 <= start2 && start2 < end1) return true;
  return start2 <= start1 && start1 < end2;
}

export function buildHintTextTokens({
  content,
  audioRange,
  hideRangesForChallenge,
  showHints,
  unhide,
}: {
  content: ContentWithHints;
  audioRange?: number;
  hideRangesForChallenge?: HideRange[];
  showHints: boolean;
  unhide?: number;
}): Token[] {
  const visible: ContentWithHints = showHints
    ? content
    : {
        ...content,
        hintMap: [],
        hints: undefined,
        hints_pronunciation: undefined,
      };

  let entry: HideRange | undefined = hideRangesForChallenge?.[0];
  if (entry) {
    if (unhide === -1) entry = undefined;
    else if (unhide && unhide > entry.start)
      entry = { start: unhide, end: Math.max(entry.end, unhide) };
  }

  const tokens: Token[] = [];
  const hiddenGroupKey = entry
    ? `hidden:${entry.start}:${entry.end}`
    : undefined;

  const pushRun = (
    start: number,
    end: number,
    hint?: Token["hint"],
    hintGroupKey?: string,
  ): void => {
    const pieces = splitTextTokens(visible.text.substring(start, end));
    let position = start;
    for (const piece of pieces) {
      // Separate whitespace from punctuation (e.g. ". " -> "." + " ") so
      // whitespace alone defines the wrap points.
      for (const sub of piece.split(/(\s+)/)) {
        if (!sub) continue;
        const pieceStart = position;
        const pieceEnd = position + sub.length;
        position = pieceEnd;
        const boundaries = new Set([pieceStart, pieceEnd]);

        if (entry) {
          if (entry.start > pieceStart && entry.start < pieceEnd)
            boundaries.add(entry.start);
          if (entry.end > pieceStart && entry.end < pieceEnd)
            boundaries.add(entry.end);
        }
        for (const range of hideRangesForChallenge ?? []) {
          if (range.start > pieceStart && range.start < pieceEnd)
            boundaries.add(range.start);
          if (range.end > pieceStart && range.end < pieceEnd)
            boundaries.add(range.end);
        }

        const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
        for (let index = 0; index < sortedBoundaries.length - 1; index += 1) {
          const fragmentStart = sortedBoundaries[index];
          const fragmentEnd = sortedBoundaries[index + 1];
          if (fragmentStart === undefined || fragmentEnd === undefined)
            continue;

          const hidden =
            entry !== undefined &&
            getOverlap(fragmentStart, fragmentEnd, entry.start, entry.end);
          const wasHidden = Boolean(
            hideRangesForChallenge?.some((range) =>
              getOverlap(fragmentStart, fragmentEnd, range.start, range.end),
            ),
          );
          tokens.push({
            text: sub.slice(
              fragmentStart - pieceStart,
              fragmentEnd - pieceStart,
            ),
            start: fragmentStart,
            hidden,
            hiddenGroupKey: hidden ? hiddenGroupKey : undefined,
            revealed: wasHidden && !hidden,
            dimmed:
              audioRange !== undefined &&
              (audioRange === 0 ||
                (audioRange > 0 && audioRange < fragmentStart)),
            hint,
            hintGroupKey,
          });
        }
      }
    }
  };

  let textPos = 0;
  for (const hint of visible.hintMap ?? []) {
    if (hint.rangeFrom > textPos) pushRun(textPos, hint.rangeFrom);
    const translation = visible.hints?.[hint.hintIndex];
    const pronunciation = visible.hints_pronunciation?.[hint.hintIndex];
    const hintGroupKey = translation
      ? `hint:${hint.rangeFrom}:${hint.rangeTo}:${hint.hintIndex}`
      : undefined;
    pushRun(
      hint.rangeFrom,
      hint.rangeTo + 1,
      translation ? { translation, pronunciation } : undefined,
      hintGroupKey,
    );
    textPos = hint.rangeTo + 1;
  }
  if (textPos < visible.text.length) pushRun(textPos, visible.text.length);

  return tokens;
}
