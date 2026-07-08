import React from "react";
import { StyleSheet, View } from "react-native";
import { fontSizes, type ThemeColors, useTheme } from "../../theme";
import { SmartImage } from "../../components/SmartImage";
import { HintText } from "../HintText";
import { getLanguageTextStyle } from "../languageStyles";
import { useLineAudio } from "../useLineAudio";
import { PlayAudioButton } from "./PlayAudioButton";
import type { StoryElementHeader } from "../types";

export function Header({
  element,
  active,
  rtl,
  autoPlay = true,
  replayKey = 0,
  audioRangeOverride,
  onManualAudioPlay,
}: {
  element: StoryElementHeader;
  active: boolean;
  rtl: boolean;
  autoPlay?: boolean;
  replayKey?: number;
  audioRangeOverride?: number;
  onManualAudioPlay?: () => void;
}) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const audio = element.learningLanguageTitleContent?.audio;
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

  return (
    <View style={styles.root}>
      <SmartImage uri={element.illustrationUrl} width={175} height={175} />
      <View style={[styles.titleRow, rtl && styles.titleRowRtl]}>
        {lineAudio.hasAudio && <PlayAudioButton onPress={handlePlay} rtl={rtl} />}
        <HintText
          content={element.learningLanguageTitleContent}
          audioRange={audioRange}
          lang={element.lang}
          rtl={rtl}
          centered
          style={[
            styles.title,
            getLanguageTextStyle(element.lang, styles.title),
          ]}
          containerStyle={{ flexShrink: 1 }}
        />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  root: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: 12,
  },
  titleRowRtl: {
    flexDirection: "row-reverse",
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: "700",
    color: colors.text,
  },
  });
}
