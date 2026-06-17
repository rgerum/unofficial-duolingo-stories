import React from "react";
import {
  Pressable,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { Text } from "../components/Text";
import { colors } from "../theme";
import { HintPopupContext } from "./HintPopup";
import type { ContentWithHints, HideRange } from "./types";

// Web-parity text renderer (StoryLineHints): hinted words get a dashed
// underline with a gap below the text, challenge-hidden words a solid
// underline with invisible text. RN's textDecoration can't draw offset
// dashes, so the text is laid out as a wrapping row of word tokens whose
// underlines are real (dashed) bottom borders.

const UNDERLINE_DASHED = "#e5e5e5";
const UNDERLINE_SOLID = "#7b7b7b";

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
};

export function HintText({
  content,
  audioRange,
  hideRangesForChallenge,
  unhide,
  showHints = true,
  style,
  containerStyle,
  rtl = false,
  centered = false,
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
  rtl?: boolean;
  centered?: boolean;
}) {
  const popup = React.useContext(HintPopupContext);

  if (!content) return null;

  const visible: ContentWithHints = showHints
    ? content
    : { ...content, hintMap: [], hints: undefined, hints_pronunciation: undefined };

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
  ): void => {
    const pieces = splitTextTokens(visible.text.substring(start, end));
    let position = start;
    for (const piece of pieces) {
      // Separate whitespace from punctuation (e.g. ". " → "." + " ") so
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
        });
      }
    }
  };

  let textPos = 0;
  for (const hint of visible.hintMap ?? []) {
    if (hint.rangeFrom > textPos) pushRun(textPos, hint.rangeFrom);
    const translation = visible.hints?.[hint.hintIndex];
    const pronunciation = visible.hints_pronunciation?.[hint.hintIndex];
    pushRun(
      hint.rangeFrom,
      hint.rangeTo + 1,
      translation ? { translation, pronunciation } : undefined,
    );
    textPos = hint.rangeTo + 1;
  }
  if (textPos < visible.text.length) pushRun(textPos, visible.text.length);

  const flatStyle = Array.isArray(style)
    ? Object.assign({}, ...style)
    : (style ?? {});

  const renderBox = (token: Token, key: React.Key) => {
    // Story texts contain runs of spaces (HTML collapses them, RN
    // doesn't) — collapse for display only; hint indices stay intact.
    const displayText = token.text.replace(/\s+/g, " ");

    const interactive = Boolean(token.hint) && !token.hidden;
    const underline = token.hidden
      ? UNDERLINE_SOLID
      : token.revealed || interactive
        ? UNDERLINE_DASHED
        : undefined;
    const color = token.hidden
      ? "transparent"
      : token.dimmed
        ? colors.disabled
        : (flatStyle.color ?? colors.text);

    // Every token gets the same box metrics (text + 3px gap + 2px underline
    // window) so underlined and plain words share a baseline. RN draws
    // dotted borders only on fully-bordered views, so the underline is a
    // clipped 2px window over one.
    return (
      <Pressable
        key={key}
        disabled={!interactive}
        onPress={(event) => {
          if (!token.hint) return;
          popup.show({
            translation: token.hint.translation,
            pronunciation: token.hint.pronunciation,
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
          });
        }}
        style={{ marginBottom: 2 }}
      >
        <Text style={[flatStyle, { color, lineHeight: undefined }]}>
          {displayText}
        </Text>
        <View style={{ height: 2, marginTop: 3, overflow: "hidden" }}>
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
    if (/^\s+$/.test(token.text)) {
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

  return (
    <View
      style={[
        {
          flexDirection: rtl ? "row-reverse" : "row",
          flexWrap: "wrap",
          alignItems: "flex-end",
        },
        centered && { justifyContent: "center" },
        containerStyle,
      ]}
    >
      {atoms.map((atom, index) => {
        if (atom.type === "break") {
          return <View key={index} style={{ width: "100%", height: 0 }} />;
        }
        if (atom.tokens.length === 1) {
          return (
            <View
              key={index}
              style={
                atom.trailingSpaceWidth > 0
                  ? rtl
                    ? { marginLeft: atom.trailingSpaceWidth }
                    : { marginRight: atom.trailingSpaceWidth }
                  : undefined
              }
            >
              {renderBox(atom.tokens[0], index)}
            </View>
          );
        }
        return (
          <View
            key={index}
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
            {atom.tokens.map((token, tokenIndex) =>
              renderBox(token, tokenIndex),
            )}
          </View>
        );
      })}
    </View>
  );
}
