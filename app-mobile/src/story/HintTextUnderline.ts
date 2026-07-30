import type { Token } from "./HintTextTokens";

export const UNDERLINE_EDGE_INSET = 2;
export const UNDERLINE_DOT_RADIUS = 1.2;
export const UNDERLINE_DOT_GAP = 7;
export const UNDERLINE_HINT_EDGE_INSET = UNDERLINE_DOT_GAP / 2;
export const HINT_SPLIT_MARKER = "\u2060";
export const UNDERLINE_BASELINE_GAP = 5;
export const UNDERLINE_BOTTOM_INSET = 2;

export type NativeTokenPart = {
  text: string;
  underlineGroupKey?: string;
  hint?: Token["hint"] | null;
};

export type MeasuredUnderlineSegment = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ascender: number;
  hidden: boolean;
  revealed: boolean;
  hint?: Token["hint"];
  text: string;
  underlineGroupKey?: string;
};

export type UnderlineSegment = {
  key: string;
  x1: number;
  x2: number;
  y: number;
  color: string;
  dotted: boolean;
  dotAnchor?: "start" | "end";
  underlineGroupKey?: string;
  debugX: number;
  debugY: number;
  debugWidth: number;
  debugHeight: number;
};

export type UnderlineColors = {
  border: string;
  hiddenUnderline: string;
};

export function getDottedUnderlineDotCenters({
  x1,
  x2,
  dotGap = UNDERLINE_DOT_GAP,
  edgeInset = 0,
  anchor,
}: {
  x1: number;
  x2: number;
  dotGap?: number;
  edgeInset?: number;
  anchor?: "start" | "end";
}): number[] {
  const width = Math.max(0, x2 - x1);
  const drawableWidth = Math.max(0, width - edgeInset * 2);
  const dotCount = Math.max(1, Math.floor(drawableWidth / dotGap) + 1);
  const dotSpan = (dotCount - 1) * dotGap;
  const startX =
    anchor === "start"
      ? x1 + edgeInset
      : anchor === "end"
        ? x2 - edgeInset - dotSpan
        : x1 + (width - dotSpan) / 2;

  return Array.from(
    { length: dotCount },
    (_, index) => startX + index * dotGap,
  );
}

export function splitNativeTokenParts({
  token,
  displayText,
  shouldSplitIntoGraphemes,
  splitIntoGraphemes,
}: {
  token: Token;
  displayText: string;
  shouldSplitIntoGraphemes: boolean;
  splitIntoGraphemes: (text: string) => string[];
}): NativeTokenPart[] {
  if (token.hidden || !displayText.includes(HINT_SPLIT_MARKER)) {
    return shouldSplitIntoGraphemes
      ? splitIntoGraphemes(displayText).map((text) => ({ text }))
      : [{ text: displayText }];
  }

  const rawParts = displayText.split(new RegExp(`(${HINT_SPLIT_MARKER})`, "u"));
  let underlinePart = 0;
  return rawParts
    .filter((text) => text !== "")
    .map((text) => {
      if (text === HINT_SPLIT_MARKER) {
        return { text, hint: null, underlineGroupKey: undefined };
      }

      const underlineGroupKey = token.revealed
        ? `revealed:${token.start}:${underlinePart}`
        : token.hintGroupKey
          ? `${token.hintGroupKey}:${underlinePart}`
          : undefined;
      underlinePart += 1;
      return { text, hint: token.hint, underlineGroupKey };
    });
}

function getBaselineY(segment: MeasuredUnderlineSegment) {
  return segment.y + segment.ascender;
}

function getUnderlineY(segment: MeasuredUnderlineSegment) {
  const baselineY = getBaselineY(segment);
  const preferredY = baselineY + UNDERLINE_BASELINE_GAP;
  const minY = segment.y + UNDERLINE_BOTTOM_INSET;
  const maxY = segment.y + segment.height - UNDERLINE_BOTTOM_INSET;
  return Math.max(minY, Math.min(preferredY, maxY));
}

export function buildUnderlineSegments({
  computedSegments,
  colors,
}: {
  computedSegments: MeasuredUnderlineSegment[];
  colors: UnderlineColors;
}): UnderlineSegment[] {
  const segmentsToDraw: UnderlineSegment[] = [];
  const hiddenGroupSpans = new Map<string, UnderlineSegment>();
  for (let index = 0; index < computedSegments.length; index += 1) {
    const segment = computedSegments[index]!;
    const interactive = Boolean(segment.hint) && !segment.hidden;
    const underline = segment.hidden
      ? colors.hiddenUnderline
      : segment.revealed || interactive
        ? colors.border
        : undefined;
    if (!underline) continue;

    if (segment.hidden && segment.underlineGroupKey) {
      const y = getUnderlineY(segment);
      const lineKey = `${segment.underlineGroupKey}:${Math.round(y)}`;
      const existing = hiddenGroupSpans.get(lineKey);
      if (existing) {
        const right = Math.max(existing.x2, segment.x + segment.width);
        existing.x1 = Math.min(existing.x1, segment.x);
        existing.x2 = right;
        existing.debugX = Math.min(existing.debugX, segment.x);
        existing.debugWidth = right - existing.debugX;
        existing.debugHeight = Math.max(existing.debugHeight, segment.height);
      } else {
        hiddenGroupSpans.set(lineKey, {
          key: lineKey,
          x1: segment.x,
          x2: segment.x + segment.width,
          y,
          color: underline,
          dotted: false,
          dotAnchor: undefined,
          underlineGroupKey: segment.underlineGroupKey,
          debugX: segment.x,
          debugY: segment.y,
          debugWidth: segment.width,
          debugHeight: segment.height,
        });
      }
      continue;
    }

    if (/^\s+$/.test(segment.text) && !segment.underlineGroupKey) continue;
    if (
      /^[,.:;!?%)}\]\u3001\u3002\u30fb\uff01\uff1f\uff09\uff0c\uff0e\u200b-\u200d\ufeff]+$/u.test(
        segment.text,
      )
    )
      continue;

    const dotted = !segment.hidden;
    const edgeInset = dotted ? UNDERLINE_HINT_EDGE_INSET : UNDERLINE_EDGE_INSET;
    const dotAnchor =
      computedSegments[index - 1]?.text === HINT_SPLIT_MARKER
        ? "start"
        : computedSegments[index + 1]?.text === HINT_SPLIT_MARKER
          ? "end"
          : undefined;
    segmentsToDraw.push({
      key: segment.key,
      x1: segment.x + edgeInset,
      x2: segment.x + Math.max(segment.width - edgeInset, edgeInset * 2),
      y: getUnderlineY(segment),
      color: underline,
      dotted,
      dotAnchor,
      underlineGroupKey: segment.underlineGroupKey,
      debugX: segment.x,
      debugY: segment.y,
      debugWidth: segment.width,
      debugHeight: segment.height,
    });
  }
  for (const segment of hiddenGroupSpans.values()) {
    segmentsToDraw.push({
      ...segment,
      x1: segment.x1 + UNDERLINE_EDGE_INSET,
      x2: segment.x2 - UNDERLINE_EDGE_INSET,
    });
  }

  segmentsToDraw.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 2) return a.y - b.y;
    return a.x1 - b.x1;
  });

  const merged: UnderlineSegment[] = [];
  for (const segment of segmentsToDraw) {
    const last = merged[merged.length - 1];
    const sameGroupOnSameLine =
      last &&
      Math.abs(last.y - segment.y) <= 2 &&
      last.color === segment.color &&
      last.dotted === segment.dotted &&
      last.underlineGroupKey !== undefined &&
      last.underlineGroupKey === segment.underlineGroupKey;
    if (
      sameGroupOnSameLine ||
      (last &&
        Math.abs(last.y - segment.y) <= 2 &&
        Math.abs(last.x2 - segment.x1) <= 4 &&
        last.color === segment.color &&
        last.dotted === segment.dotted &&
        last.underlineGroupKey === segment.underlineGroupKey)
    ) {
      last.x2 = segment.x2;
      last.debugWidth = segment.debugX + segment.debugWidth - last.debugX;
      last.debugHeight = Math.max(last.debugHeight, segment.debugHeight);
      continue;
    }
    merged.push(segment);
  }

  return merged;
}
