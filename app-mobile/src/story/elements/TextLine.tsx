import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { fontSizes, type ThemeColors, useTheme } from "../../theme";
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

function shouldUseNativeStoryText(lang?: string): boolean {
  if (!lang) return false;
  return /^(ja|zh|ko)(-|$)/i.test(lang);
}

function BubbleTail({
  colors,
  rtl,
  styles,
}: {
  colors: ThemeColors;
  rtl: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
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
  styles,
  inlineAudio = false,
  naturalWidth = false,
  children,
}: {
  hasAudio: boolean;
  onPlay: () => void;
  rtl: boolean;
  styles: ReturnType<typeof createStyles>;
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
        naturalWidth ? styles.bodyNatural : styles.body,
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
  audioRangeOverride,
  onManualAudioPlay,
}: {
  element: StoryElementLine;
  active: boolean;
  unhide?: number;
  rtl: boolean;
  autoPlay?: boolean;
  replayKey?: number;
  audioRangeOverride?: number;
  onManualAudioPlay?: () => void;
}) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const audio = element.line?.content?.audio;
  const lineAudio = useLineAudio(
    audio,
    active,
    autoPlay,
    replayKey,
  );
  const audioRange = audioRangeOverride ?? lineAudio.audioRange;
  const handlePlay = React.useCallback(() => {
    onManualAudioPlay?.();
    lineAudio.play();
  }, [lineAudio, onManualAudioPlay]);

  const lineRtl = getStoryLineRtl({
    storyRtl: rtl,
    lineLang: element.lang,
  });
  const hideRanges = element.hideRangesForChallenge;
  const textStyle = {
    fontSize: fontSizes.body,
    color: colors.text,
  };
  const preferNativeText = shouldUseNativeStoryText(element.lang);

  if (element.line === undefined) return null;

  if (element.line.type === "TITLE") {
    return (
      <View style={[styles.row, lineRtl && styles.rowRtl]}>
        <LineBody
          hasAudio={lineAudio.hasAudio}
          onPlay={handlePlay}
          rtl={lineRtl}
          styles={styles}
        >
          <HintText
            content={element.line.content}
            audioRange={audioRange}
            hideRangesForChallenge={hideRanges}
            unhide={unhide}
            lang={element.lang}
            renderMode={preferNativeText ? "native" : "tokenized"}
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
          <View
            style={[
              styles.bubble,
              lineRtl ? styles.bubblePaddingRtl : styles.bubblePaddingLtr,
              lineRtl && styles.bubbleRtl,
              lineRtl
                ? { borderTopRightRadius: 0 }
                : { borderTopLeftRadius: 0 },
            ]}
          >
            <LineBody
              hasAudio={preferNativeText ? lineAudio.hasAudio : false}
              onPlay={handlePlay}
              rtl={lineRtl}
              styles={styles}
              naturalWidth={!preferNativeText}
            >
              <HintText
                content={element.line.content}
                audioRange={audioRange}
                hideRangesForChallenge={hideRanges}
                unhide={unhide}
                lang={element.lang}
                renderMode={preferNativeText ? "native" : "tokenized"}
                rtl={lineRtl}
                containerStyle={lineRtl ? styles.rtlBubbleText : undefined}
                leadingElement={
                  !preferNativeText && lineAudio.hasAudio ? (
                    <PlayAudioButton onPress={handlePlay} rtl={lineRtl} />
                  ) : undefined
                }
                style={[
                  textStyle,
                  getLanguageTextStyle(element.lang, textStyle),
                ]}
              />
            </LineBody>
          </View>
          <BubbleTail colors={colors} rtl={lineRtl} styles={styles} />
        </View>
      </View>
    );
  }

  // PROSE (or CHARACTER without avatar)
  return (
    <View style={[styles.row, lineRtl && styles.rowRtl]}>
      <LineBody
        hasAudio={lineAudio.hasAudio}
        onPlay={handlePlay}
        rtl={lineRtl}
        styles={styles}
      >
        <HintText
          content={element.line.content}
          audioRange={audioRange}
          hideRangesForChallenge={hideRanges}
          unhide={unhide}
          lang={element.lang}
          renderMode={preferNativeText ? "native" : "tokenized"}
          rtl={lineRtl}
          containerStyle={lineRtl ? styles.rtlProseText : undefined}
          fillLineWidth={lineRtl}
          style={[textStyle, getLanguageTextStyle(element.lang, textStyle)]}
        />
      </LineBody>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
    paddingBottom: 9,
  },
  bubblePaddingLtr: {
    paddingLeft: 15,
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
  rtlProseText: {
    flexShrink: 1,
    minWidth: 0,
    width: "100%",
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
}
