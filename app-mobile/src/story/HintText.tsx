import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type View as NativeView,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Line, Rect, Text as SvgText } from "react-native-svg";
import { Text } from "../components/Text";
import { type ThemeColors, useTheme } from "../theme";
import {
  PLAY_AUDIO_ICON_FONT_FAMILY,
  PLAY_AUDIO_ICON_GLYPH,
  PLAY_AUDIO_ICON_SIZE,
} from "./elements/PlayAudioButton";
import { HintLookupContext, HintPopupContext } from "./HintPopup";
import type { ContentWithHints, HideRange } from "./types";

// Web-parity text renderer (StoryLineHints): hinted words get a dashed
// underline with a gap below the text, challenge-hidden words a solid
// underline with invisible text. RN's textDecoration can't draw offset
// dashes, so the text is laid out as a wrapping row of word tokens whose
// underlines are real (dashed) bottom borders.

const WRAPPED_LINE_GAP = 3;
const UNDERLINE_EDGE_INSET = 2;
const UNDERLINE_DOT_RADIUS = 1.2;
const UNDERLINE_DOT_GAP = 7;
const INLINE_AUDIO_SPACE = "\u2002";
const UNDERLINE_BASELINE_GAP = 4;
const UNDERLINE_BOTTOM_INSET = 2;

type HintTextRenderMode = "auto" | "native" | "tokenized";

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

type Token = {
  text: string;
  start: number;
  hidden: boolean;
  hiddenGroupKey?: string;
  revealed: boolean;
  dimmed: boolean;
  hint?: { translation: string; pronunciation?: string };
  hintGroupKey?: string;
};

type NativeSegment = Token & {
  key: string;
  tokenKey: string;
  underlineGroupKey?: string;
  textStyle?: TextStyle;
};

type MeasurementItem = {
  key: string;
  text: string;
  textStyle?: TextStyle;
  segmentKeys: string[];
};

type NativeTextLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type NativeLineLayout = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ascender: number;
  descender: number;
  capHeight: number;
  xHeight: number;
};

type ComputedSegment = {
  key: string;
  start: number;
  x: number;
  y: number;
  width: number;
  height: number;
  ascender: number;
  descender: number;
  text: string;
  hidden: boolean;
  revealed: boolean;
  hint?: Token["hint"];
  tokenKey: string;
  underlineGroupKey?: string;
};

type TokenFragment = { x1: number; x2: number; y: number; height: number };

type HiddenCover = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type UnderlineSegment = {
  key: string;
  x1: number;
  x2: number;
  y: number;
  color: string;
  dotted: boolean;
  underlineGroupKey?: string;
  debugX: number;
  debugY: number;
  debugWidth: number;
  debugHeight: number;
};

type DebugRect = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  groupLabel?: string;
  stroke: string;
  fill: string;
};

type DebugBaseline = {
  key: string;
  x1: number;
  x2: number;
  baselineY: number;
  underlineY: number;
  baselineLabel: string;
  underlineLabel: string;
};

function getDisplayText(token: Token): string {
  return token.text.replace(/\s+/g, " ");
}

export function shouldUseNativeTextLayout(lang?: string, rtl = false): boolean {
  return Boolean(lang) && !rtl;
}

let graphemeSegmenter: Intl.Segmenter | undefined;

function getGraphemeSegmenter(): Intl.Segmenter | undefined {
  if (graphemeSegmenter) return graphemeSegmenter;
  if (typeof Intl === "undefined" || !("Segmenter" in Intl)) return undefined;
  graphemeSegmenter = new Intl.Segmenter(undefined, {
    granularity: "grapheme",
  });
  return graphemeSegmenter;
}

function isCombiningCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x0300 && codePoint <= 0x036f) ||
    (codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
    (codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
    (codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
    (codePoint >= 0xfe20 && codePoint <= 0xfe2f) ||
    (codePoint >= 0x3099 && codePoint <= 0x309a) ||
    (codePoint >= 0x0c00 && codePoint <= 0x0c04) ||
    (codePoint >= 0x0c3c && codePoint <= 0x0c56) ||
    (codePoint >= 0x0c62 && codePoint <= 0x0c63)
  );
}

function isVariationSelector(codePoint: number): boolean {
  return (
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
    (codePoint >= 0xe0100 && codePoint <= 0xe01ef)
  );
}

function isEmojiModifier(codePoint: number): boolean {
  return codePoint >= 0x1f3fb && codePoint <= 0x1f3ff;
}

function isRegionalIndicator(codePoint: number): boolean {
  return codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff;
}

function splitIntoGraphemesFallback(text: string): string[] {
  const codePoints = Array.from(text);
  const graphemes: string[] = [];
  let joinNext = false;
  let regionalIndicatorRun = 0;

  for (const char of codePoints) {
    const codePoint = char.codePointAt(0) ?? 0;
    const lastIndex = graphemes.length - 1;
    const last = lastIndex >= 0 ? graphemes[lastIndex] : undefined;
    const appendToLast =
      last !== undefined &&
      (joinNext ||
        codePoint === 0x200d ||
        isCombiningCodePoint(codePoint) ||
        isVariationSelector(codePoint) ||
        isEmojiModifier(codePoint) ||
        (isRegionalIndicator(codePoint) && regionalIndicatorRun % 2 === 1));

    if (appendToLast) {
      graphemes[lastIndex] = `${last}${char}`;
    } else {
      graphemes.push(char);
    }

    joinNext = codePoint === 0x200d;
    regionalIndicatorRun = isRegionalIndicator(codePoint)
      ? regionalIndicatorRun + 1
      : 0;
  }

  return graphemes;
}

function splitIntoGraphemes(text: string): string[] {
  if (!text) return [];
  if (/^\s+$/.test(text)) return [text];

  const segmenter = getGraphemeSegmenter();
  if (segmenter) {
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }

  return splitIntoGraphemesFallback(text);
}

function shouldMeasureTokenAsGraphemes(text: string): boolean {
  return /[\u0c00-\u0c7f\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/u.test(
    text,
  );
}

function buildNativeSegments(tokens: Token[]): NativeSegment[] {
  const segments: NativeSegment[] = [];

  for (const token of tokens) {
    const displayText = getDisplayText(token);
    const parts = shouldMeasureTokenAsGraphemes(displayText)
      ? splitIntoGraphemes(displayText)
      : [displayText];
    for (const part of parts) {
      segments.push({
        ...token,
        text: part,
        key: `${token.start}:${segments.length}`,
        tokenKey: `${token.start}:${token.text}`,
        underlineGroupKey: token.hidden
          ? token.hiddenGroupKey
          : token.revealed
            ? `revealed:${token.start}`
            : token.hintGroupKey,
      });
    }
  }

  return segments;
}

function getMeasurementKey(segment: NativeSegment): string {
  return `${segment.text}:${JSON.stringify(segment.textStyle ?? {})}`;
}

function buildMeasurementItems(
  measurementSegments: NativeSegment[],
): MeasurementItem[] {
  const itemByKey = new Map<string, MeasurementItem>();

  for (const segment of measurementSegments) {
    const key = getMeasurementKey(segment);
    const existing = itemByKey.get(key);
    if (existing) {
      existing.segmentKeys.push(segment.key);
      continue;
    }

    itemByKey.set(key, {
      key,
      text: segment.text,
      textStyle: segment.textStyle,
      segmentKeys: [segment.key],
    });
  }

  return Array.from(itemByKey.values());
}

function getDebugColor(key?: string): { stroke: string; fill: string } {
  if (!key) {
    return {
      stroke: "#00e5ff",
      fill: "rgba(0,229,255,0.16)",
    };
  }

  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }

  const hue = hash % 360;
  return {
    stroke: `hsl(${hue} 100% 42%)`,
    fill: `hsla(${hue} 100% 55% / 0.28)`,
  };
}

function buildComputedSegments({
  lineLayouts,
  measurementSegments,
  segmentWidths,
  textLayout,
}: {
  lineLayouts: NativeLineLayout[];
  measurementSegments: NativeSegment[];
  segmentWidths: Record<string, number>;
  textLayout: NativeTextLayout;
}): ComputedSegment[] {
  const rects: ComputedSegment[] = [];
  let segmentIndex = 0;

  for (const line of lineLayouts) {
    let cursor = line.x;
    let lineText = line.text;

    while (lineText.length > 0 && segmentIndex < measurementSegments.length) {
      const segment = measurementSegments[segmentIndex];
      const width = segmentWidths[segment.key];
      if (width === undefined) break;
      if (!lineText.startsWith(segment.text)) break;

      rects.push({
        key: segment.key,
        start: segment.start,
        x: textLayout.x + cursor,
        y: textLayout.y + line.y,
        width,
        height: line.height,
        ascender: line.ascender,
        descender: line.descender,
        text: segment.text,
        hidden: segment.hidden,
        revealed: segment.revealed,
        hint: segment.hint,
        tokenKey: segment.tokenKey,
        underlineGroupKey: segment.underlineGroupKey,
      });

      cursor += width;
      lineText = lineText.slice(segment.text.length);
      segmentIndex += 1;
    }
  }

  return rects;
}

function buildTokenFragments(computedSegments: ComputedSegment[]) {
  const fragments = new Map<string, TokenFragment[]>();

  for (const segment of computedSegments) {
    if (segment.start < 0) continue;

    const list = fragments.get(segment.tokenKey) ?? [];
    const last = list[list.length - 1];
    const x1 = segment.x;
    const x2 = segment.x + segment.width;

    if (
      last &&
      Math.abs(last.y - segment.y) <= 2 &&
      Math.abs(last.x2 - x1) <= 2
    ) {
      last.x2 = x2;
      last.height = Math.max(last.height, segment.height);
    } else {
      list.push({
        x1,
        x2,
        y: segment.y,
        height: segment.height,
      });
    }

    fragments.set(segment.tokenKey, list);
  }

  return fragments;
}

function buildHiddenCovers(computedSegments: ComputedSegment[]): HiddenCover[] {
  const covers: HiddenCover[] = [];
  for (const segment of computedSegments) {
    if (!segment.hidden) continue;
    const last = covers[covers.length - 1];
    const x = segment.x - 1;
    const width = segment.width + 2;
    if (
      last &&
      Math.abs(last.y - segment.y) <= 2 &&
      Math.abs(last.x + last.width - x) <= 2
    ) {
      last.width = x + width - last.x;
      last.height = Math.max(last.height, segment.height);
      continue;
    }
    covers.push({
      key: `hidden:${segment.key}`,
      x,
      y: segment.y,
      width,
      height: segment.height,
    });
  }

  return covers;
}

function getBaselineY(segment: ComputedSegment) {
  return segment.y + segment.ascender;
}

function getUnderlineY(segment: ComputedSegment) {
  const baselineY = getBaselineY(segment);
  const preferredY = baselineY + UNDERLINE_BASELINE_GAP;
  const minY = segment.y + UNDERLINE_BOTTOM_INSET;
  const maxY = segment.y + segment.height - UNDERLINE_BOTTOM_INSET;
  return Math.max(minY, Math.min(preferredY, maxY));
}

function buildUnderlineSegments({
  computedSegments,
  colors,
}: {
  computedSegments: ComputedSegment[];
  colors: ThemeColors;
}): UnderlineSegment[] {
  const segmentsToDraw: UnderlineSegment[] = [];
  const hiddenGroupSpans = new Map<string, UnderlineSegment>();
  for (const segment of computedSegments) {
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
    segmentsToDraw.push({
      key: segment.key,
      x1: segment.x + UNDERLINE_EDGE_INSET,
      x2:
        segment.x +
        Math.max(
          segment.width - UNDERLINE_EDGE_INSET,
          UNDERLINE_EDGE_INSET * 2,
        ),
      y: getUnderlineY(segment),
      color: underline,
      dotted: !segment.hidden,
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

function buildDebugRects(
  computedSegments: ComputedSegment[],
  enabled: boolean,
): DebugRect[] {
  if (!enabled) return [];

  const groupLabels = new Map<string, string>();
  let nextGroup = 1;

  return computedSegments.map((segment) => {
    const groupKey = segment.underlineGroupKey;
    if (groupKey && !groupLabels.has(groupKey)) {
      groupLabels.set(groupKey, `g${nextGroup}`);
      nextGroup += 1;
    }

    return {
      key: segment.key,
      x: segment.x,
      y: segment.y,
      width: segment.width,
      height: segment.height,
      text: /^\s+$/.test(segment.text) ? "sp" : segment.text,
      groupLabel: groupKey ? groupLabels.get(groupKey) : undefined,
      ...getDebugColor(groupKey),
    };
  });
}

function buildDebugBaselines(
  computedSegments: ComputedSegment[],
  enabled: boolean,
): DebugBaseline[] {
  if (!enabled) return [];

  const baselines = new Map<string, DebugBaseline>();
  for (const segment of computedSegments) {
    const y = getBaselineY(segment);
    const key = `baseline:${Math.round(y)}`;
    const existing = baselines.get(key);
    if (existing) {
      existing.x1 = Math.min(existing.x1, segment.x - 12);
      existing.x2 = Math.max(existing.x2, segment.x + segment.width + 12);
      continue;
    }
    baselines.set(key, {
      key,
      x1: segment.x - 12,
      x2: segment.x + segment.width + 12,
      baselineY: y,
      underlineY: getUnderlineY(segment),
      baselineLabel: `BASELINE ${Math.round(y)}`,
      underlineLabel: `UNDERLINE ${Math.round(getUnderlineY(segment))}`,
    });
  }

  return Array.from(baselines.values());
}

function HintTokenBox({
  token,
  displayText,
  textStyle,
  hiddenTextStyle,
  underline,
  spaceWidth,
  popup,
  onLookup,
}: {
  token: Token;
  displayText: string;
  textStyle: TextStyle;
  hiddenTextStyle?: { opacity: number };
  underline?: string;
  spaceWidth?: number;
  popup: React.ContextType<typeof HintPopupContext>;
  onLookup: () => void;
}) {
  const tokenLayoutRef = React.useRef({ width: 0, height: 0 });
  const interactive = Boolean(token.hint) && !token.hidden;

  return (
    <View
      onLayout={(event) => {
        tokenLayoutRef.current = {
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        };
      }}
      style={{ alignSelf: "flex-start", marginBottom: 2 }}
    >
      <Pressable
        disabled={!interactive}
        onPress={(event) => {
          if (!token.hint) return;
          const hint = token.hint;
          onLookup();
          const { locationX, locationY, pageX, pageY } = event.nativeEvent;
          const { width, height } = tokenLayoutRef.current;
          const calculatedX = width > 0 ? pageX - locationX + width / 2 : pageX;
          const calculatedY = height > 0 ? pageY - locationY : pageY;
          popup.show({
            translation: hint.translation,
            pronunciation: hint.pronunciation,
            x: calculatedX,
            y: calculatedY,
          });
        }}
      >
        <Text
          style={[
            textStyle,
            { lineHeight: undefined },
            spaceWidth !== undefined && { width: spaceWidth },
            hiddenTextStyle,
          ]}
        >
          {displayText}
        </Text>
        <View style={{ height: 2, marginTop: -2, overflow: "hidden" }}>
          {underline && (
            <View
              style={{
                height: 8,
                borderWidth: 2,
                borderStyle: token.hidden ? "solid" : "dotted",
                borderColor: underline,
              }}
            />
          )}
        </View>
      </Pressable>
    </View>
  );
}

function HintPhraseBox({
  tokens,
  textStyle,
  rtl,
  collapsedSpaceWidth,
  colors,
  popup,
  onLookup,
}: {
  tokens: Token[];
  textStyle: TextStyle;
  rtl: boolean;
  collapsedSpaceWidth: number;
  colors: ThemeColors;
  popup: React.ContextType<typeof HintPopupContext>;
  onLookup: () => void;
}) {
  const phraseLayoutRef = React.useRef({ width: 0, height: 0 });
  const hint = tokens.find((token) => token.hint)?.hint;
  const interactive = Boolean(hint) && !tokens.some((token) => token.hidden);
  const underline = tokens.some((token) => token.hidden)
    ? colors.hiddenUnderline
    : tokens.some((token) => token.revealed || token.hint)
      ? colors.border
      : undefined;

  return (
    <View
      onLayout={(event) => {
        phraseLayoutRef.current = {
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        };
      }}
      style={{ alignSelf: "flex-start", marginBottom: 2 }}
    >
      <Pressable
        disabled={!interactive}
        onPress={(event) => {
          if (!hint) return;
          onLookup();
          const { locationX, locationY, pageX, pageY } = event.nativeEvent;
          const { width, height } = phraseLayoutRef.current;
          const calculatedX = width > 0 ? pageX - locationX + width / 2 : pageX;
          const calculatedY = height > 0 ? pageY - locationY : pageY;
          popup.show({
            translation: hint.translation,
            pronunciation: hint.pronunciation,
            x: calculatedX,
            y: calculatedY,
          });
        }}
      >
        <View
          style={{
            flexDirection: rtl ? "row-reverse" : "row",
            alignItems: "flex-end",
          }}
        >
          {tokens.map((token, index) => {
            const displayText = getDisplayText(token);
            const isWhitespace = /^\s+$/.test(token.text);
            const color = token.hidden
              ? colors.background
              : token.dimmed
                ? colors.disabled
                : (textStyle.color ?? colors.text);
            return (
              <Text
                key={index}
                style={[
                  textStyle,
                  { color, lineHeight: undefined },
                  isWhitespace && {
                    width: displayText.length * collapsedSpaceWidth,
                  },
                  token.hidden && { opacity: 0 },
                ]}
              >
                {displayText}
              </Text>
            );
          })}
        </View>
        <View style={{ height: 2, marginTop: -2, overflow: "hidden" }}>
          {underline && (
            <View
              style={{
                height: 8,
                borderWidth: 2,
                borderStyle: tokens.some((token) => token.hidden)
                  ? "solid"
                  : "dotted",
                borderColor: underline,
              }}
            />
          )}
        </View>
      </Pressable>
    </View>
  );
}

function buildTokens({
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

function NativeHintOverlay({
  hiddenCovers,
  debugRects,
  debugBaselines,
  underlineSegments,
  colors,
  drawCovers = true,
  drawUnderlines = true,
  drawRangeDebug = false,
}: {
  hiddenCovers: HiddenCover[];
  debugRects: DebugRect[];
  debugBaselines?: DebugBaseline[];
  underlineSegments: UnderlineSegment[];
  colors: ThemeColors;
  drawCovers?: boolean;
  drawUnderlines?: boolean;
  drawRangeDebug?: boolean;
}) {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
      {drawCovers &&
        hiddenCovers.map((cover) => (
          <Rect
            key={cover.key}
            x={cover.x}
            y={cover.y}
            width={cover.width}
            height={cover.height}
            fill={colors.surface}
          />
        ))}
      {drawRangeDebug &&
        underlineSegments.map((segment) => (
          <Rect
            key={`range-debug:${segment.key}`}
            x={segment.debugX}
            y={segment.debugY}
            width={segment.debugWidth}
            height={segment.debugHeight}
            stroke="#ff00d4"
            strokeWidth={3}
            strokeDasharray="5 4"
            fill="rgba(255,0,212,0.08)"
          />
        ))}
      {drawCovers &&
        debugRects.map((segment) => (
          <React.Fragment key={`debug:${segment.key}`}>
            <Rect
              x={segment.x}
              y={segment.y}
              width={segment.width}
              height={segment.height}
              stroke={segment.stroke}
              strokeWidth={1}
              fill={segment.fill}
            />
            <SvgText
              x={segment.x}
              y={segment.y - 2}
              fontSize="10"
              fill={segment.stroke}
            >
              {segment.groupLabel ?? "none"}
            </SvgText>
            <SvgText
              x={segment.x + 1}
              y={segment.y + segment.height - 10}
              fontSize="8"
              fill={segment.stroke}
            >
              {segment.text}
            </SvgText>
          </React.Fragment>
        ))}
      {drawCovers &&
        debugBaselines?.map((baseline) => (
          <React.Fragment key={baseline.key}>
            <Line
              x1={baseline.x1}
              x2={baseline.x2}
              y1={baseline.baselineY}
              y2={baseline.baselineY}
              stroke="#111111"
              strokeWidth={5}
            />
            <Line
              x1={baseline.x1}
              x2={baseline.x2}
              y1={baseline.baselineY}
              y2={baseline.baselineY}
              stroke="#ffff00"
              strokeWidth={2}
            />
            <Line
              x1={baseline.x1}
              x2={baseline.x2}
              y1={baseline.underlineY}
              y2={baseline.underlineY}
              stroke="#111111"
              strokeWidth={5}
              strokeDasharray="8 5"
            />
            <Line
              x1={baseline.x1}
              x2={baseline.x2}
              y1={baseline.underlineY}
              y2={baseline.underlineY}
              stroke="#ff00d4"
              strokeWidth={2}
              strokeDasharray="8 5"
            />
            <Line
              x1={baseline.x1}
              x2={baseline.x1}
              y1={baseline.baselineY - 8}
              y2={baseline.underlineY + 8}
              stroke="#111111"
              strokeWidth={5}
            />
            <Line
              x1={baseline.x2}
              x2={baseline.x2}
              y1={baseline.baselineY - 8}
              y2={baseline.underlineY + 8}
              stroke="#111111"
              strokeWidth={5}
            />
            <Line
              x1={baseline.x1}
              x2={baseline.x1}
              y1={baseline.baselineY - 8}
              y2={baseline.underlineY + 8}
              stroke="#ffff00"
              strokeWidth={2}
            />
            <Line
              x1={baseline.x2}
              x2={baseline.x2}
              y1={baseline.baselineY - 8}
              y2={baseline.underlineY + 8}
              stroke="#ffff00"
              strokeWidth={2}
            />
            <Rect
              x={baseline.x1}
              y={baseline.baselineY - 27}
              width={108}
              height={17}
              fill="#111111"
            />
            <SvgText
              x={baseline.x1 + 4}
              y={baseline.baselineY - 14}
              fontSize="11"
              fill="#ffff00"
            >
              {baseline.baselineLabel}
            </SvgText>
            <Rect
              x={baseline.x1}
              y={baseline.underlineY + 8}
              width={118}
              height={17}
              fill="#111111"
            />
            <SvgText
              x={baseline.x1 + 4}
              y={baseline.underlineY + 21}
              fontSize="11"
              fill="#ff00d4"
            >
              {baseline.underlineLabel}
            </SvgText>
          </React.Fragment>
        ))}
      {drawUnderlines &&
        underlineSegments.map((segment) => (
          <React.Fragment key={segment.key}>
            {segment.dotted ? (
              Array.from({
                length: Math.max(
                  1,
                  Math.floor((segment.x2 - segment.x1) / UNDERLINE_DOT_GAP) + 1,
                ),
              }).map((_, index) => {
                const cx = Math.min(
                  segment.x2,
                  segment.x1 + index * UNDERLINE_DOT_GAP,
                );
                return (
                  <Circle
                    key={`${segment.key}:${index}`}
                    cx={cx}
                    cy={segment.y}
                    r={UNDERLINE_DOT_RADIUS}
                    fill={segment.color}
                  />
                );
              })
            ) : (
              <Line
                x1={segment.x1}
                x2={segment.x2}
                y1={segment.y}
                y2={segment.y}
                stroke={segment.color}
                strokeWidth={2}
              />
            )}
          </React.Fragment>
        ))}
    </Svg>
  );
}

function NativeHintText({
  tokens,
  flatStyle,
  containerStyle,
  inlineAudio,
  rtl,
  centered,
  fillLineWidth,
  debugNativeLayout,
}: {
  tokens: Token[];
  flatStyle: TextStyle;
  containerStyle?: ViewStyle;
  inlineAudio?: { onPress: () => void; color: string };
  rtl: boolean;
  centered: boolean;
  fillLineWidth: boolean;
  debugNativeLayout: boolean;
}) {
  const { colors } = useTheme();
  const popup = React.useContext(HintPopupContext);
  const onHintLookup = React.useContext(HintLookupContext);
  const containerRef = React.useRef<NativeView>(null);
  const measurementSegments = React.useMemo(() => {
    const segments = buildNativeSegments(tokens);
    if (!inlineAudio) return segments;

    const prefix: NativeSegment[] = [
      {
        key: "audio:glyph",
        text: PLAY_AUDIO_ICON_GLYPH,
        start: -2,
        hidden: false,
        revealed: false,
        dimmed: false,
        tokenKey: "audio:glyph",
        textStyle: {
          fontFamily: PLAY_AUDIO_ICON_FONT_FAMILY,
          fontSize: PLAY_AUDIO_ICON_SIZE,
          color: inlineAudio.color,
        },
      },
      {
        key: "audio:space",
        text: INLINE_AUDIO_SPACE,
        start: -1,
        hidden: false,
        revealed: false,
        dimmed: false,
        tokenKey: "audio:space",
      },
    ];

    return prefix.concat(segments);
  }, [inlineAudio, tokens]);
  const [textLayout, setTextLayout] = React.useState<NativeTextLayout>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [lineLayouts, setLineLayouts] = React.useState<NativeLineLayout[]>([]);
  const [segmentWidths, setSegmentWidths] = React.useState<
    Record<string, number>
  >({});
  const measurementItems = React.useMemo(
    () => buildMeasurementItems(measurementSegments),
    [measurementSegments],
  );

  const computedSegments = React.useMemo(
    () =>
      buildComputedSegments({
        lineLayouts,
        measurementSegments,
        segmentWidths,
        textLayout,
      }),
    [lineLayouts, measurementSegments, segmentWidths, textLayout],
  );
  const tokenFragments = React.useMemo(
    () => buildTokenFragments(computedSegments),
    [computedSegments],
  );

  const hiddenCovers = React.useMemo(
    () => buildHiddenCovers(computedSegments),
    [computedSegments],
  );

  const showMeasuredHint = React.useCallback(
    (
      token: Token,
      tokenKey: string,
      event: { nativeEvent: { pageX: number; pageY: number } },
    ) => {
      if (!token.hint) return;

      const fallbackX = event.nativeEvent.pageX;
      const fallbackY = event.nativeEvent.pageY;
      const fragments = tokenFragments.get(tokenKey);

      const showAt = (x: number, y: number) => {
        onHintLookup();
        popup.show({
          translation: token.hint!.translation,
          pronunciation: token.hint!.pronunciation,
          x,
          y,
        });
      };

      if (!fragments?.length || !containerRef.current?.measureInWindow) {
        showAt(fallbackX, fallbackY);
        return;
      }

      containerRef.current.measureInWindow((pageLeft, pageTop) => {
        const localPageY = fallbackY - pageTop;
        const fragment =
          fragments.find(
            (candidate) =>
              localPageY >= candidate.y &&
              localPageY <= candidate.y + candidate.height,
          ) ??
          fragments.reduce((best, candidate) => {
            const bestDistance = Math.abs(
              localPageY - (best.y + best.height / 2),
            );
            const candidateDistance = Math.abs(
              localPageY - (candidate.y + candidate.height / 2),
            );
            return candidateDistance < bestDistance ? candidate : best;
          });

        showAt(
          pageLeft + (fragment.x1 + fragment.x2) / 2,
          pageTop + fragment.y,
        );
      });
    },
    [onHintLookup, popup, tokenFragments],
  );

  const underlineSegments = React.useMemo(
    () => buildUnderlineSegments({ computedSegments, colors }),
    [colors, computedSegments],
  );
  const visibleUnderlineSegments = React.useMemo(
    () => underlineSegments.filter((segment) => segment.dotted),
    [underlineSegments],
  );
  const hiddenUnderlineSegments = React.useMemo(
    () => underlineSegments.filter((segment) => !segment.dotted),
    [underlineSegments],
  );

  const debugRects = React.useMemo(
    () => buildDebugRects(computedSegments, debugNativeLayout),
    [computedSegments, debugNativeLayout],
  );

  const debugBaselines = React.useMemo(
    () => buildDebugBaselines(computedSegments, debugNativeLayout),
    [computedSegments, debugNativeLayout],
  );

  return (
    <View
      ref={containerRef}
      style={[
        {
          minWidth: 0,
          alignSelf: fillLineWidth ? "stretch" : "flex-start",
          width: fillLineWidth ? "100%" : undefined,
        },
        containerStyle,
      ]}
    >
      <NativeHintOverlay
        hiddenCovers={[]}
        debugRects={[]}
        debugBaselines={[]}
        underlineSegments={visibleUnderlineSegments}
        colors={colors}
        drawCovers={false}
      />
      <Text
        onLayout={(event) => {
          setTextLayout(event.nativeEvent.layout);
        }}
        onTextLayout={(event) => {
          setLineLayouts(
            event.nativeEvent.lines.map((line) => ({
              text: line.text,
              x: line.x,
              y: line.y,
              width: line.width,
              height: line.height,
              ascender: line.ascender,
              descender: line.descender,
              capHeight: line.capHeight,
              xHeight: line.xHeight,
            })),
          );
        }}
        style={[
          flatStyle,
          {
            minWidth: 0,
            writingDirection: rtl ? "rtl" : "ltr",
            textAlign: centered ? "center" : "auto",
            alignSelf: fillLineWidth ? "stretch" : "flex-start",
          },
        ]}
      >
        {inlineAudio && (
          <Text
            suppressHighlighting
            onPress={inlineAudio.onPress}
            style={{
              fontFamily: PLAY_AUDIO_ICON_FONT_FAMILY,
              fontSize: PLAY_AUDIO_ICON_SIZE,
              color: inlineAudio.color,
            }}
          >
            {PLAY_AUDIO_ICON_GLYPH}
          </Text>
        )}
        {inlineAudio && <Text>{INLINE_AUDIO_SPACE}</Text>}
        {tokens.map((token) => {
          const interactive = Boolean(token.hint) && !token.hidden;
          const color = token.hidden
            ? "transparent"
            : token.dimmed
              ? colors.disabled
              : (flatStyle.color ?? colors.text);
          const tokenKey = `${token.start}:${token.text}`;

          return (
            <Text
              key={`display:${tokenKey}`}
              suppressHighlighting
              onPress={
                interactive
                  ? (event) => {
                      showMeasuredHint(token, tokenKey, event);
                    }
                  : undefined
              }
              style={[
                flatStyle,
                {
                  color,
                  opacity: token.hidden ? 0 : 1,
                },
              ]}
            >
              {getDisplayText(token)}
            </Text>
          );
        })}
      </Text>
      <NativeHintOverlay
        hiddenCovers={hiddenCovers}
        debugRects={debugRects}
        debugBaselines={debugBaselines}
        underlineSegments={
          debugNativeLayout ? underlineSegments : hiddenUnderlineSegments
        }
        colors={colors}
        drawUnderlines
        drawRangeDebug={debugNativeLayout}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          opacity: 0,
          left: -10000,
          top: 0,
          flexDirection: "row",
          flexWrap: "nowrap",
        }}
      >
        {measurementItems.map((item) => (
          <Text
            key={`measure:${item.key}`}
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              setSegmentWidths((current) => {
                let next: Record<string, number> | undefined;
                for (const segmentKey of item.segmentKeys) {
                  if (current[segmentKey] === width) continue;
                  next ??= { ...current };
                  next[segmentKey] = width;
                }
                return next ?? current;
              });
            }}
            style={[flatStyle, { lineHeight: undefined }, item.textStyle]}
          >
            {item.text}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function HintText({
  content,
  audioRange,
  hideRangesForChallenge,
  unhide,
  showHints = true,
  style,
  containerStyle,
  leadingElement,
  inlineAudio,
  lang,
  rtl = false,
  centered = false,
  fillLineWidth = false,
  renderMode = "auto",
  debugNativeLayout = false,
}: {
  content: ContentWithHints;
  /** Highest spoken character index during playback (99999 = idle). */
  audioRange?: number;
  hideRangesForChallenge?: HideRange[];
  /** Progressive reveal for arrange/continuation (-1 reveals everything). */
  unhide?: number;
  showHints?: boolean;
  style?: StyleProp<TextStyle>;
  containerStyle?: ViewStyle;
  leadingElement?: React.ReactNode;
  inlineAudio?: { onPress: () => void; color: string };
  lang?: string;
  rtl?: boolean;
  centered?: boolean;
  fillLineWidth?: boolean;
  renderMode?: HintTextRenderMode;
  debugNativeLayout?: boolean;
}) {
  const { colors } = useTheme();
  const popup = React.useContext(HintPopupContext);
  const onHintLookup = React.useContext(HintLookupContext);

  if (!content) return null;

  const flatStyle = StyleSheet.flatten(style) ?? {};
  const tokens = buildTokens({
    content,
    audioRange,
    hideRangesForChallenge,
    showHints,
    unhide,
  });
  const resolvedRenderMode =
    renderMode === "auto"
      ? shouldUseNativeTextLayout(lang, rtl)
        ? "native"
        : "tokenized"
      : renderMode;

  if (resolvedRenderMode === "native") {
    return (
      <NativeHintText
        tokens={tokens}
        flatStyle={flatStyle}
        containerStyle={containerStyle}
        inlineAudio={inlineAudio}
        rtl={rtl}
        centered={centered}
        fillLineWidth={fillLineWidth}
        debugNativeLayout={debugNativeLayout}
      />
    );
  }

  const renderBox = (token: Token, key: React.Key) => {
    // Story texts contain runs of spaces (HTML collapses them, RN
    // doesn't) — collapse for display only; hint indices stay intact.
    const displayText = getDisplayText(token);
    const isWhitespace = /^\s+$/.test(token.text);

    const interactive = Boolean(token.hint) && !token.hidden;
    const underline = token.hidden
      ? colors.hiddenUnderline
      : token.revealed || interactive
        ? colors.border
        : undefined;
    const color = token.hidden
      ? colors.background
      : token.dimmed
        ? colors.disabled
        : (flatStyle.color ?? colors.text);
    const hiddenTextStyle = token.hidden ? { opacity: 0 } : undefined;

    return (
      <HintTokenBox
        key={key}
        token={token}
        displayText={displayText}
        textStyle={{ ...flatStyle, color }}
        hiddenTextStyle={hiddenTextStyle}
        underline={underline}
        spaceWidth={
          isWhitespace ? displayText.length * collapsedSpaceWidth : undefined
        }
        popup={popup}
        onLookup={onHintLookup}
      />
    );
  };

  const fontSize =
    typeof flatStyle.fontSize === "number" ? flatStyle.fontSize : 19;
  const collapsedSpaceWidth = Math.ceil(fontSize * 0.35);

  // Wrapping happens between flex children. Adjacent word/punctuation tokens
  // are glued into one atom — the browser never breaks between "det" and "?"
  // and neither should we. Whitespace becomes trailing margin on the previous
  // cluster, so a standalone space cannot wrap to the start of the next line.
  type Atom =
    | { type: "break" }
    | { type: "cluster"; tokens: Token[]; trailingSpaceWidth: number };
  const atoms: Atom[] = [];
  let afterWhitespace = false;
  const appendTrailingSpace = (token: Token) => {
    const last = atoms[atoms.length - 1];
    if (!last || last.type !== "cluster") return;
    const collapsedLength = token.text.replace(/\s+/g, " ").length;
    last.trailingSpaceWidth += collapsedLength * collapsedSpaceWidth;
    afterWhitespace = true;
  };

  for (const token of tokens) {
    if (token.text.includes("\n")) {
      atoms.push({ type: "break" });
      afterWhitespace = false;
      continue;
    }
    if (
      /^\s+$/.test(token.text) &&
      !token.hint &&
      !token.hidden &&
      !token.revealed
    ) {
      appendTrailingSpace(token);
      continue;
    }
    const last = atoms[atoms.length - 1];
    if (last && last.type === "cluster" && !afterWhitespace) {
      last.tokens.push(token);
    } else
      atoms.push({ type: "cluster", tokens: [token], trailingSpaceWidth: 0 });
    afterWhitespace = false;
  }

  const androidRtlLineBreakPadding =
    Platform.OS === "android" && rtl ? Math.ceil(fontSize * 0) : 0;

  const atomLines = atoms.reduce<Extract<Atom, { type: "cluster" }>[][]>(
    (lines, atom) => {
      if (atom.type === "break") lines.push([]);
      else lines[lines.length - 1]?.push(atom);
      return lines;
    },
    [[]],
  );

  const renderAtom = (
    atom: Extract<Atom, { type: "cluster" }>,
    key: React.Key,
  ) => {
    const hint = atom.tokens.find((token) => token.hint)?.hint;
    const isPhraseHint =
      hint !== undefined &&
      atom.tokens.length > 1 &&
      atom.tokens.every((token) => token.hint === hint);
    if (isPhraseHint) {
      return (
        <View
          key={key}
          style={
            atom.trailingSpaceWidth > 0
              ? rtl
                ? { marginLeft: atom.trailingSpaceWidth }
                : { marginRight: atom.trailingSpaceWidth }
              : undefined
          }
        >
          <HintPhraseBox
            tokens={atom.tokens}
            textStyle={flatStyle}
            rtl={rtl}
            collapsedSpaceWidth={collapsedSpaceWidth}
            colors={colors}
            popup={popup}
            onLookup={onHintLookup}
          />
        </View>
      );
    }

    if (atom.tokens.length === 1) {
      return (
        <View
          key={key}
          style={
            atom.trailingSpaceWidth > 0
              ? rtl
                ? { marginLeft: atom.trailingSpaceWidth }
                : { marginRight: atom.trailingSpaceWidth }
              : undefined
          }
        >
          {renderBox(atom.tokens[0], key)}
        </View>
      );
    }
    return (
      <View
        key={key}
        style={{
          flexDirection: rtl ? "row-reverse" : "row",
          alignItems: "flex-end",
          ...(atom.trailingSpaceWidth > 0
            ? rtl
              ? { marginLeft: atom.trailingSpaceWidth }
              : { marginRight: atom.trailingSpaceWidth }
            : null),
        }}
      >
        {atom.tokens.map((token, tokenIndex) => renderBox(token, tokenIndex))}
      </View>
    );
  };

  return (
    <View
      style={[
        {
          flexDirection: "column",
          alignItems: fillLineWidth ? "stretch" : "flex-start",
          paddingBottom: androidRtlLineBreakPadding,
        },
        centered && { justifyContent: "center" },
        containerStyle,
      ]}
    >
      {atomLines.map((lineAtoms, lineIndex) => (
        <View
          key={lineIndex}
          style={{
            marginBottom:
              lineIndex < atomLines.length - 1 ? WRAPPED_LINE_GAP : 3,
            ...(fillLineWidth ? { alignSelf: "stretch", width: "100%" } : null),
            flexDirection: rtl ? "row-reverse" : "row",
            flexWrap: "wrap",
            rowGap: WRAPPED_LINE_GAP,
            alignItems: "flex-end",
            justifyContent: "flex-start",
          }}
        >
          {lineIndex === 0 && leadingElement}
          {lineAtoms.map((atom, atomIndex) =>
            renderAtom(atom, `${lineIndex}:${atomIndex}`),
          )}
        </View>
      ))}
    </View>
  );
}
