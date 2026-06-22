import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, fontSizes } from "../../theme";
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
  onManualAudioPlay,
}: {
  element: StoryElementHeader;
  active: boolean;
  rtl: boolean;
  autoPlay?: boolean;
  replayKey?: number;
  onManualAudioPlay?: () => void;
}) {
  const audio = element.learningLanguageTitleContent?.audio;
  const { audioRange, play, hasAudio } = useLineAudio(
    audio,
    active,
    autoPlay,
    replayKey,
  );
  const handlePlay = React.useCallback(() => {
    onManualAudioPlay?.();
    play();
  }, [onManualAudioPlay, play]);

  return (
    <View style={styles.root}>
      <SmartImage uri={element.illustrationUrl} width={175} height={175} />
      <View style={[styles.titleRow, rtl && styles.titleRowRtl]}>
        {hasAudio && <PlayAudioButton onPress={handlePlay} rtl={rtl} />}
        <HintText
          content={element.learningLanguageTitleContent}
          audioRange={audioRange}
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

const styles = StyleSheet.create({
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
