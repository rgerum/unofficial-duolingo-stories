import React from "react";
import {
  Pressable,
  Platform,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { Text } from "../components/Text";
import { colors } from "../theme";
import { HintLookupContext, HintPopupContext } from "./HintPopup";
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

function getDisplayText(token: Token): string {
  return token.text.replace(/\s+/g, " ");
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
  popup,
  onLookup,
}: {
  tokens: Token[];
  textStyle: TextStyle;
  rtl: boolean;
  collapsedSpaceWidth: number;
  popup: React.ContextType<typeof HintPopupContext>;
  onLookup: () => void;
}) {
  const phraseLayoutRef = React.useRef({ width: 0, height: 0 });
  const hint = tokens.find((token) => token.hint)?.hint;
  const interactive = Boolean(hint) && !tokens.some((token) => token.hidden);
  const underline = tokens.some((token) => token.hidden)
    ? UNDERLINE_SOLID
    : tokens.some((token) => token.revealed || token.hint)
      ? UNDERLINE_DASHED
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
  fillLineWidth = false,
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
  fillLineWidth?: boolean;
}) {
  const popup = React.useContext(HintPopupContext);
  const onHintLookup = React.useContext(HintLookupContext);

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
    const displayText = getDisplayText(token);
    const isWhitespace = /^\s+$/.test(token.text);

    const interactive = Boolean(token.hint) && !token.hidden;
    const underline = token.hidden
      ? UNDERLINE_SOLID
      : token.revealed || interactive
        ? UNDERLINE_DASHED
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
            ...(fillLineWidth
              ? { alignSelf: "stretch", width: "100%" }
              : null),
            flexDirection: rtl ? "row-reverse" : "row",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "flex-start",
          }}
        >
          {lineAtoms.map((atom, atomIndex) =>
            renderAtom(atom, `${lineIndex}:${atomIndex}`),
          )}
        </View>
      ))}
    </View>
  );
}
