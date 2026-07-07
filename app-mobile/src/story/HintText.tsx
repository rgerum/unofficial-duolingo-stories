import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Line, Rect } from "react-native-svg";
import { Text } from "../components/Text";
import { type ThemeColors, useTheme } from "../theme";
import { HintLookupContext, HintPopupContext } from "./HintPopup";
import type { ContentWithHints, HideRange } from "./types";

// Web-parity text renderer (StoryLineHints): hinted words get a dashed
// underline with a gap below the text, challenge-hidden words a solid
// underline with invisible text. RN's textDecoration can't draw offset
// dashes, so the text is laid out as a wrapping row of word tokens whose
// underlines are real (dashed) bottom borders.

const WRAPPED_LINE_GAP = 3;
const NATIVE_TEXT_AUDIO_PADDING = 32;
const SHOW_NATIVE_HINT_DEBUG = false;
const UNDERLINE_EDGE_INSET = 2;

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
  revealed: boolean;
  dimmed: boolean;
  hint?: { translation: string; pronunciation?: string };
  hintGroupKey?: string;
};

type NativeSegment = Token & {
  key: string;
  underlineGroupKey?: string;
};

function getDisplayText(token: Token): string {
  return token.text.replace(/\s+/g, " ");
}

function shouldUseNativeTextLayout(lang?: string): boolean {
  if (!lang) return false;
  return /^(ja|zh|ko)(-|$)/i.test(lang);
}

function isWrapAnywhereToken(text: string): boolean {
  return /^[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]+$/u.test(
    text,
  );
}

function buildNativeSegments(tokens: Token[]): NativeSegment[] {
  const segments: NativeSegment[] = [];

  for (const token of tokens) {
    const parts = isWrapAnywhereToken(token.text) ? Array.from(token.text) : [token.text];
    for (const part of parts) {
      segments.push({
        ...token,
        text: part,
        key: `${token.start}:${segments.length}`,
        underlineGroupKey: token.hidden
          ? `hidden:${token.start}`
          : token.revealed
            ? `revealed:${token.start}`
            : token.hintGroupKey,
      });
    }
  }

  return segments;
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
        const hidden =
          entry !== undefined &&
          getOverlap(pieceStart, pieceEnd, entry.start, entry.end);
        const wasHidden = Boolean(
          hideRangesForChallenge?.some((range) =>
            getOverlap(pieceStart, pieceEnd, range.start, range.end),
          ),
        );
        tokens.push({
          text: sub,
          start: pieceStart,
          hidden,
          revealed: wasHidden && !hidden,
          dimmed:
            audioRange !== undefined &&
            (audioRange === 0 ||
              (audioRange > 0 && audioRange < pieceStart)),
          hint,
          hintGroupKey,
        });
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
  leadingElement,
  rtl,
  centered,
  fillLineWidth,
}: {
  tokens: Token[];
  flatStyle: TextStyle;
  containerStyle?: ViewStyle;
  leadingElement?: React.ReactNode;
  rtl: boolean;
  centered: boolean;
  fillLineWidth: boolean;
}) {
  const { colors } = useTheme();
  const popup = React.useContext(HintPopupContext);
  const onHintLookup = React.useContext(HintLookupContext);
  const segments = React.useMemo(() => buildNativeSegments(tokens), [tokens]);
  const [textLayout, setTextLayout] = React.useState({ x: 0, y: 0, width: 0, height: 0 });
  const [lineLayouts, setLineLayouts] = React.useState<
    { text: string; x: number; y: number; width: number; height: number }[]
  >([]);
  const [segmentWidths, setSegmentWidths] = React.useState<Record<string, number>>({});

  const computedSegments = React.useMemo(() => {
    const rects: Array<{
      key: string;
      x: number;
      y: number;
      width: number;
      height: number;
      text: string;
      hidden: boolean;
      revealed: boolean;
      hint?: Token["hint"];
      underlineGroupKey?: string;
    }> = [];
    let segmentIndex = 0;

    for (const line of lineLayouts) {
      let cursor = line.x;
      let lineText = line.text;

      while (lineText.length > 0 && segmentIndex < segments.length) {
        const segment = segments[segmentIndex];
        const width = segmentWidths[segment.key];
        if (width === undefined) break;
        if (!lineText.startsWith(segment.text)) break;

        rects.push({
          key: segment.key,
          x: textLayout.x + cursor,
          y: textLayout.y + line.y,
          width,
          height: line.height,
          text: segment.text,
          hidden: segment.hidden,
          revealed: segment.revealed,
          hint: segment.hint,
          underlineGroupKey: segment.underlineGroupKey,
        });

        cursor += width;
        lineText = lineText.slice(segment.text.length);
        segmentIndex += 1;
      }
    }

    return rects;
  }, [lineLayouts, segmentWidths, segments, textLayout.x, textLayout.y]);

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

    const segmentsToDraw: UnderlineSegment[] = [];
    for (const segment of computedSegments) {
      const interactive = Boolean(segment.hint) && !segment.hidden;
      const underline = segment.hidden
        ? colors.hiddenUnderline
        : segment.revealed || interactive
          ? colors.border
          : undefined;
      if (!underline) continue;
      if (/^[,.:;!?%)}\]\u3001\u3002\u30fb\u30fc\uff01\uff1f\uff09\uff0c\uff0e\u200b-\u200d\ufeff]+$/u.test(segment.text))
        continue;
      segmentsToDraw.push({
        key: segment.key,
        x1: segment.x + UNDERLINE_EDGE_INSET,
        x2: segment.x + Math.max(segment.width - UNDERLINE_EDGE_INSET, UNDERLINE_EDGE_INSET * 2),
        y: segment.y + segment.height - 6,
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
      if (
        last &&
        Math.abs(last.y - segment.y) <= 2 &&
        Math.abs(last.x2 - segment.x1) <= 4 &&
        last.color === segment.color &&
        last.dotted === segment.dotted &&
        last.underlineGroupKey === segment.underlineGroupKey
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
    () =>
      SHOW_NATIVE_HINT_DEBUG
        ? computedSegments.map((segment) => ({
            key: segment.key,
            x: segment.x,
            y: segment.y,
            width: segment.width,
            height: segment.height,
          }))
        : [],
    [computedSegments],
  );

  return (
    <View
      style={[
        {
          minWidth: 0,
          alignSelf: fillLineWidth ? "stretch" : "flex-start",
          width: fillLineWidth ? "100%" : undefined,
        },
        containerStyle,
      ]}
    >
      <Svg
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        {debugRects.map((segment) => (
          <Rect
            key={`debug:${segment.key}`}
            x={segment.x}
            y={segment.y}
            width={segment.width}
            height={segment.height}
            stroke="#ff4d4f"
            strokeWidth={1}
            fill="rgba(255,77,79,0.08)"
          />
        ))}
        {underlineSegments.map((segment) => (
          <React.Fragment key={segment.key}>
            <Line
              x1={segment.x1}
              x2={segment.x2}
              y1={segment.y}
              y2={segment.y}
              stroke={segment.color}
              strokeWidth={segment.dotted ? 1.5 : 2}
              strokeLinecap="round"
              strokeDasharray={segment.dotted ? [1, 4] : undefined}
            />
          </React.Fragment>
        ))}
      </Svg>
      {leadingElement && (
        <View
          style={[
            {
              position: "absolute",
              top: 2,
              zIndex: 1,
            },
            rtl ? { right: 0 } : { left: 0 },
          ]}
        >
          {leadingElement}
        </View>
      )}
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
          leadingElement
            ? rtl
              ? { paddingRight: NATIVE_TEXT_AUDIO_PADDING }
              : { paddingLeft: NATIVE_TEXT_AUDIO_PADDING }
            : undefined,
        ]}
      >
        {segments.map((segment) => {
          const interactive = Boolean(segment.hint) && !segment.hidden;
          const color = segment.hidden
            ? "transparent"
            : segment.dimmed
              ? colors.disabled
              : (flatStyle.color ?? colors.text);

          return (
            <Text
              key={segment.key}
              suppressHighlighting
              onPress={
                interactive
                  ? (event) => {
                      if (!segment.hint) return;
                      onHintLookup();
                      popup.show({
                        translation: segment.hint.translation,
                        pronunciation: segment.hint.pronunciation,
                        x: event.nativeEvent.pageX,
                        y: event.nativeEvent.pageY,
                      });
                    }
                  : undefined
              }
              style={[
                flatStyle,
                {
                  color,
                },
              ]}
            >
              {segment.text}
            </Text>
          );
        })}
      </Text>
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
        {segments.map((segment) => (
          <Text
            key={`measure:${segment.key}`}
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              setSegmentWidths((current) => {
                if (current[segment.key] === width) return current;
                return { ...current, [segment.key]: width };
              });
            }}
            style={[flatStyle, { lineHeight: undefined }]}
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
        leadingElement={leadingElement}
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
