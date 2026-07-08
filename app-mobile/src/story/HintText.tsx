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
const SHOW_NATIVE_HINT_DEBUG = false;
const UNDERLINE_EDGE_INSET = 2;
const UNDERLINE_DOT_RADIUS = 1.2;
const UNDERLINE_DOT_GAP = 7;
const INLINE_AUDIO_SPACE = "\u2002";
const UNDERLINE_BASELINE_GAP = 2;
const UNDERLINE_BOTTOM_INSET = 2;

type HintTextRenderMode = "auto" | "native" | "tokenized";

function splitTextTokens(text: string): string[] {
  if (!text) return [];
  return text.split(/([\s\\¡!"#$%&*,./:;<=>¿?@^_`{|}]+)/).filter((p) => p !== "");
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

function getDisplayText(token: Token): string {
  return token.text.replace(/\s+/g, " ");
}

function shouldUseNativeTextLayout(lang?: string): boolean {
  return Boolean(lang);
}

function splitIntoGraphemes(text: string): string[] {
  if (!text) return [];
  if (/^\s+$/.test(text)) return [text];

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }

  return Array.from(text);
}

function buildNativeSegments(tokens: Token[]): NativeSegment[] {
  const segments: NativeSegment[] = [];

  for (const token of tokens) {
    const parts = splitIntoGraphemes(token.text);
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

function getDebugColor(key?: string): { stroke: string; fill: string } {
  if (!key) {
    return {
      stroke: "#8c8c8c",
      fill: "rgba(140,140,140,0.12)",
    };
  }

  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }

  const hue = hash % 360;
  return {
    stroke: `hsl(${hue} 80% 45%)`,
    fill: `hsla(${hue} 80% 55% / 0.16)`,
  };
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
          const calculatedX =
            width > 0 ? pageX - locationX + width / 2 : pageX;
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
          const calculatedX =
            width > 0 ? pageX - locationX + width / 2 : pageX;
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
  const hiddenGroupKey = entry ? `hidden:${entry.start}:${entry.end}` : undefined;

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
          if (fragmentStart === undefined || fragmentEnd === undefined) continue;

          const hidden =
            entry !== undefined &&
            getOverlap(fragmentStart, fragmentEnd, entry.start, entry.end);
          const wasHidden = Boolean(
            hideRangesForChallenge?.some((range) =>
              getOverlap(fragmentStart, fragmentEnd, range.start, range.end),
            ),
          );
          tokens.push({
            text: sub.slice(fragmentStart - pieceStart, fragmentEnd - pieceStart),
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

function NativeHintText({
  tokens,
  flatStyle,
  containerStyle,
  inlineAudio,
  rtl,
  centered,
  fillLineWidth,
}: {
  tokens: Token[];
  flatStyle: TextStyle;
  containerStyle?: ViewStyle;
  inlineAudio?: { onPress: () => void; rtl: boolean; color: string };
  rtl: boolean;
  centered: boolean;
  fillLineWidth: boolean;
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
  const [textLayout, setTextLayout] = React.useState({ x: 0, y: 0, width: 0, height: 0 });
  const [lineLayouts, setLineLayouts] = React.useState<
    {
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
      ascender: number;
      descender: number;
      capHeight: number;
      xHeight: number;
    }[]
  >([]);
  const [segmentWidths, setSegmentWidths] = React.useState<Record<string, number>>({});

  const computedSegments = React.useMemo(() => {
    const rects: Array<{
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
    }> = [];
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
  }, [lineLayouts, measurementSegments, segmentWidths, textLayout.x, textLayout.y]);
  const loggedDebugRef = React.useRef(false);

  React.useEffect(() => {
    if (!SHOW_NATIVE_HINT_DEBUG || loggedDebugRef.current) return;
    if (!measurementSegments.some((segment) => segment.text.includes("çel"))) return;
    if (computedSegments.length === 0) return;

    console.log(
      "HINT_DEBUG_SEGMENTS",
      JSON.stringify(
        computedSegments.map((segment) => ({
          text: segment.text,
          group: segment.underlineGroupKey ?? null,
          x: Math.round(segment.x),
          width: Math.round(segment.width),
        })),
      ),
    );
    loggedDebugRef.current = true;
  }, [computedSegments, measurementSegments]);

  const tokenFragments = React.useMemo(() => {
    const fragments = new Map<
      string,
      Array<{ x1: number; x2: number; y: number; height: number }>
    >();

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
  }, [computedSegments]);

  const hiddenCovers = React.useMemo(() => {
    type HiddenCover = {
      key: string;
      x: number;
      y: number;
      width: number;
      height: number;
    };

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
  }, [computedSegments]);

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

  const underlineSegments = React.useMemo(() => {
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

    function getUnderlineY(segment: (typeof computedSegments)[number]) {
      const glyphBottom = segment.y + segment.ascender + segment.descender;
      const preferredY = glyphBottom + UNDERLINE_BASELINE_GAP;
      const maxY = segment.y + segment.height - UNDERLINE_BOTTOM_INSET;
      return Math.min(preferredY, maxY);
    }

    const segmentsToDraw: UnderlineSegment[] = [];
    for (const segment of computedSegments) {
      const interactive = Boolean(segment.hint) && !segment.hidden;
      const underline = segment.hidden
        ? colors.hiddenUnderline
        : segment.revealed || interactive
          ? colors.border
          : undefined;
      if (!underline) continue;
      if (/^\s+$/.test(segment.text) && !segment.underlineGroupKey) continue;
      if (/^[,.:;!?%)}\]\u3001\u3002\u30fb\u30fc\uff01\uff1f\uff09\uff0c\uff0e\u200b-\u200d\ufeff]+$/u.test(segment.text))
        continue;
      segmentsToDraw.push({
        key: segment.key,
        x1: segment.x + UNDERLINE_EDGE_INSET,
        x2: segment.x + Math.max(segment.width - UNDERLINE_EDGE_INSET, UNDERLINE_EDGE_INSET * 2),
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
        (
          last &&
          Math.abs(last.y - segment.y) <= 2 &&
          Math.abs(last.x2 - segment.x1) <= 4 &&
          last.color === segment.color &&
          last.dotted === segment.dotted &&
          last.underlineGroupKey === segment.underlineGroupKey
        )
      ) {
        last.x2 = segment.x2;
        last.debugWidth = segment.debugX + segment.debugWidth - last.debugX;
        last.debugHeight = Math.max(last.debugHeight, segment.debugHeight);
        continue;
      }
      merged.push(segment);
    }

    return merged;
  }, [colors.border, colors.hiddenUnderline, computedSegments]);

  const debugRects = React.useMemo(
    () => {
      if (!SHOW_NATIVE_HINT_DEBUG) return [];

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
    },
    [computedSegments],
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
              {token.text}
            </Text>
          );
        })}
      </Text>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
        {hiddenCovers.map((cover) => (
          <Rect
            key={cover.key}
            x={cover.x}
            y={cover.y}
            width={cover.width}
            height={cover.height}
            fill={colors.surface}
          />
        ))}
        {debugRects.map((segment) => (
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
        {underlineSegments.map((segment) => (
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
        {measurementSegments.map((segment) => (
          <Text
            key={`measure:${segment.key}`}
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              setSegmentWidths((current) => {
                if (current[segment.key] === width) return current;
                return { ...current, [segment.key]: width };
              });
            }}
            style={[flatStyle, { lineHeight: undefined }, segment.textStyle]}
          >
            {segment.text}
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
  inlineAudio?: { onPress: () => void; rtl: boolean; color: string };
  lang?: string;
  rtl?: boolean;
  centered?: boolean;
  fillLineWidth?: boolean;
  renderMode?: HintTextRenderMode;
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
      ? (shouldUseNativeTextLayout(lang) ? "native" : "tokenized")
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
    if (/^\s+$/.test(token.text) && !token.hint) {
      appendTrailingSpace(token);
      continue;
    }
    const last = atoms[atoms.length - 1];
    if (last && last.type === "cluster" && !afterWhitespace) {
      last.tokens.push(token);
    }
    else atoms.push({ type: "cluster", tokens: [token], trailingSpaceWidth: 0 });
    afterWhitespace = false;
  }

  const androidRtlLineBreakPadding =
    Platform.OS === "android" && rtl ? Math.ceil(fontSize * 0.) : 0;

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
            ...(fillLineWidth
              ? { alignSelf: "stretch", width: "100%" }
              : null),
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
