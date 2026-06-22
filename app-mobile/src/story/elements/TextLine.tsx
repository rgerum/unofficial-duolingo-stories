import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { colors, fontSizes } from "../../theme";
import { HintText } from "../HintText";
import { getLanguageTextStyle } from "../languageStyles";
import { getStoryLineRtl } from "../textDirection";
import { useLineAudio } from "../useLineAudio";
import { PlayAudioButton } from "./PlayAudioButton";
import type { StoryElementLine } from "../types";

// Speech-bubble geometry ported from the web's StoryTextLine: rounded
// corners except where the tail attaches, with a two-triangle tail (border
// color under background color) pointing at the avatar.
const TAIL_WIDTH = 12;
const BUBBLE_HORIZONTAL_PADDING = 24;
const AUDIO_INLINE_SPACE = 32;
const MAX_ESTIMATED_BUBBLE_WIDTH = 260;

function getEstimatedTextWidth(text: string, fontSize: number): number {
  const normalized = text.replace(/\s+/g, " ").trim();
  let width = 0;

  for (const char of normalized) {
    if (/\p{Mark}/u.test(char)) continue;
    if (char === " ") width += fontSize * 0.35;
    else if (/[,.;:!?'"`]/.test(char)) width += fontSize * 0.28;
    else width += fontSize * 0.56;
  }

  return width;
}

function getBubbleMinWidth(text: string, hasAudio: boolean): number {
  return Math.min(
    MAX_ESTIMATED_BUBBLE_WIDTH,
    Math.ceil(
      getEstimatedTextWidth(text, fontSizes.body) +
        BUBBLE_HORIZONTAL_PADDING +
        (hasAudio ? AUDIO_INLINE_SPACE : 0),
    ),
  );
}

function BubbleTail({ rtl }: { rtl: boolean }) {
  const horizontal = rtl ? { right: 0 } : { left: 0 };
  const horizontalInner = rtl ? { right: 5 } : { left: 5 };
  const borderSide = rtl
    ? { borderLeftWidth: TAIL_WIDTH }
    : { borderRightWidth: TAIL_WIDTH };
  return (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.tail,
          horizontal,
          borderSide,
          {
            top: 0,
            [rtl ? "borderLeftColor" : "borderRightColor"]: colors.border,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.tail,
          horizontalInner,
          borderSide,
          {
            top: 2,
            [rtl ? "borderLeftColor" : "borderRightColor"]: colors.background,
          },
        ]}
      />
    </>
  );
}

/**
 * Text block with an optional play button. The button is absolutely
 * positioned (with matching padding) rather than a flex-row sibling: a
 * wrapping HintText that flex-shrinks next to a sibling gets mis-measured by
 * Yoga (one-line height while painting two lines), breaking bubble heights.
 * Padding gives the wrap container a definite width, which measures
 * correctly.
 */
function LineBody({
  hasAudio,
  onPlay,
  rtl,
  inlineAudio = false,
  naturalWidth = false,
  children,
}: {
  hasAudio: boolean;
  onPlay: () => void;
  rtl: boolean;
  inlineAudio?: boolean;
  naturalWidth?: boolean;
  children: React.ReactNode;
}) {
  if (hasAudio && inlineAudio) {
    return (
      <View
        style={[
          naturalWidth ? styles.bodyNatural : styles.body,
          styles.bodyInline,
          rtl && styles.bodyInlineRtl,
        ]}
      >
        <PlayAudioButton onPress={onPlay} rtl={rtl} />
        <View
          style={[
            styles.bodyTextInline,
            naturalWidth && styles.bodyTextNatural,
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.body,
        hasAudio && (rtl ? styles.bodyPadRtl : styles.bodyPad),
      ]}
    >
      {hasAudio && (
        <View style={[styles.audioButton, rtl ? { right: 0 } : { left: 0 }]}>
          <PlayAudioButton onPress={onPlay} rtl={rtl} />
        </View>
      )}
      {children}
    </View>
  );
}

export function TextLine({
  element,
  active,
  unhide = 999999,
  rtl,
  autoPlay = true,
  replayKey = 0,
}: {
  element: StoryElementLine;
  active: boolean;
  unhide?: number;
  rtl: boolean;
  autoPlay?: boolean;
  replayKey?: number;
}) {
  const audio = element.line?.content?.audio;
  const { audioRange, play, hasAudio } = useLineAudio(
    audio,
    active,
    autoPlay,
    replayKey,
  );

  const lineRtl = getStoryLineRtl({
    storyRtl: rtl,
    lineLang: element.lang,
  });
  const hideRanges = element.hideRangesForChallenge;
  const textStyle = {
    fontSize: fontSizes.body,
    color: colors.text,
  };
  const measureKey = element.line
    ? `${element.line.type}:${element.line.content.text}:${hasAudio}:${lineRtl}`
    : "";
  const [measuredCharacterBubble, setMeasuredCharacterBubble] = React.useState<{
    key: string;
    width: number;
  } | null>(null);
  const measuredWidth =
    measuredCharacterBubble?.key === measureKey
      ? measuredCharacterBubble.width
      : undefined;

  if (element.line === undefined) return null;

  if (element.line.type === "TITLE") {
    return (
      <View style={[styles.row, lineRtl && styles.rowRtl]}>
        <LineBody hasAudio={hasAudio} onPlay={play} rtl={lineRtl}>
          <HintText
            content={element.line.content}
            audioRange={audioRange}
            hideRangesForChallenge={hideRanges}
            unhide={unhide}
            rtl={lineRtl}
            style={[
              styles.title,
              getLanguageTextStyle(element.lang, styles.title),
            ]}
          />
        </LineBody>
      </View>
    );
  }

  if (element.line.type === "CHARACTER" && element.line.avatarUrl) {
    const fallbackWidth = getBubbleMinWidth(
      element.line.content.text,
      hasAudio,
    );
    const bubbleSizing = lineRtl
      ? { width: measuredWidth ?? fallbackWidth }
      : measuredWidth === undefined
        ? { minWidth: fallbackWidth }
        : { width: measuredWidth };
    const measuringCharacterBubble = measuredWidth === undefined;

    return (
      <View style={[styles.row, styles.characterRow, lineRtl && styles.rowRtl]}>
        <Image
          source={{ uri: element.line.avatarUrl }}
          style={[styles.avatar, lineRtl && styles.avatarRtl]}
          contentFit="contain"
        />
        <View
          style={[
            styles.bubbleWrap,
            lineRtl
              ? { paddingRight: TAIL_WIDTH }
              : { paddingLeft: TAIL_WIDTH },
          ]}
        >
          {measuringCharacterBubble && (
            <View
              pointerEvents="none"
              onLayout={(event) => {
                const width = Math.ceil(event.nativeEvent.layout.width);
                if (width > 0) {
                  setMeasuredCharacterBubble({ key: measureKey, width });
                }
              }}
              style={[
                styles.bubble,
                lineRtl ? styles.bubblePaddingRtl : styles.bubblePaddingLtr,
                styles.bubbleMeasureClone,
                lineRtl && styles.bubbleRtl,
                lineRtl
                  ? { borderTopRightRadius: 0 }
                  : { borderTopLeftRadius: 0 },
              ]}
            >
              <LineBody
                hasAudio={hasAudio}
                onPlay={play}
                rtl={lineRtl}
                inlineAudio
                naturalWidth
              >
                <HintText
                  content={element.line.content}
                  audioRange={audioRange}
                  hideRangesForChallenge={hideRanges}
                  unhide={unhide}
                  rtl={lineRtl}
                  containerStyle={lineRtl ? styles.rtlBubbleText : undefined}
                  fillLineWidth={lineRtl}
                  style={[
                    textStyle,
                    getLanguageTextStyle(element.lang, textStyle),
                  ]}
                />
              </LineBody>
            </View>
          )}
          <View
            style={[
              styles.bubble,
              lineRtl ? styles.bubblePaddingRtl : styles.bubblePaddingLtr,
              bubbleSizing,
              lineRtl && styles.bubbleRtl,
              lineRtl
                ? { borderTopRightRadius: 0 }
                : { borderTopLeftRadius: 0 },
            ]}
          >
            <LineBody
              hasAudio={hasAudio}
              onPlay={play}
              rtl={lineRtl}
              inlineAudio={lineRtl}
            >
              <HintText
                content={element.line.content}
                audioRange={audioRange}
                hideRangesForChallenge={hideRanges}
                unhide={unhide}
                rtl={lineRtl}
                containerStyle={lineRtl ? styles.rtlBubbleText : undefined}
                fillLineWidth={lineRtl}
                style={[
                  textStyle,
                  getLanguageTextStyle(element.lang, textStyle),
                ]}
              />
            </LineBody>
          </View>
          <BubbleTail rtl={lineRtl} />
        </View>
      </View>
    );
  }

  // PROSE (or CHARACTER without avatar)
  return (
    <View style={[styles.row, lineRtl && styles.rowRtl]}>
      <LineBody hasAudio={hasAudio} onPlay={play} rtl={lineRtl}>
        <HintText
          content={element.line.content}
          audioRange={audioRange}
          hideRangesForChallenge={hideRanges}
          unhide={unhide}
          rtl={lineRtl}
          style={[textStyle, getLanguageTextStyle(element.lang, textStyle)]}
        />
      </LineBody>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 10,
  },
  rowRtl: {
    flexDirection: "row-reverse",
  },
  characterRow: {
    marginVertical: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    marginRight: 6,
  },
  avatarRtl: {
    marginRight: 0,
    marginLeft: 6,
    transform: [{ scaleX: -1 }],
  },
  bubbleWrap: {
    flex: 1,
    alignSelf: "flex-start",
  },
  bubble: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.background,
    paddingTop: 10,
    paddingBottom: 10,
  },
  bubblePaddingLtr: {
    paddingLeft: 10,
    paddingRight: 15,
  },
  bubblePaddingRtl: {
    paddingRight: 10,
    paddingLeft: 15,
  },
  bubbleRtl: {
    alignSelf: "flex-end",
  },
  body: {
    flexShrink: 1,
    minWidth: 0,
    width: "100%",
  },
  bodyNatural: {
    alignSelf: "flex-start",
    flexShrink: 1,
    minWidth: 0,
  },
  bodyPad: {
    paddingLeft: 32,
  },
  bodyPadRtl: {
    paddingRight: 32,
  },
  bodyInline: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bodyInlineRtl: {
    flexDirection: "row-reverse",
  },
  bodyTextInline: {
    flexShrink: 1,
    minWidth: 0,
  },
  bodyTextNatural: {
    alignSelf: "flex-start",
  },
  rtlBubbleText: {
    flexShrink: 1,
    minWidth: 0,
  },
  bubbleMeasureClone: {
    opacity: 0,
    position: "absolute",
    zIndex: -1,
  },
  audioButton: {
    position: "absolute",
    top: 2,
  },
  tail: {
    position: "absolute",
    width: 0,
    height: 0,
    borderBottomWidth: TAIL_WIDTH,
    borderBottomColor: "transparent",
    borderStyle: "solid",
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: "700",
    color: colors.text,
  },
});
