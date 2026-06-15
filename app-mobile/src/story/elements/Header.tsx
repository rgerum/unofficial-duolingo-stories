import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, fontSizes } from "../../theme";
import { SmartImage } from "../../components/SmartImage";
import { HintText } from "../HintText";
import { useLineAudio } from "../useLineAudio";
import { PlayAudioButton } from "./PlayAudioButton";
import type { StoryElementHeader } from "../types";

export function Header({
  element,
  active,
  rtl,
}: {
  element: StoryElementHeader;
  active: boolean;
  rtl: boolean;
}) {
  const audio = element.learningLanguageTitleContent?.audio;
  const { audioRange, play, hasAudio } = useLineAudio(audio, active, true);

  return (
    <View style={styles.root}>
      <SmartImage uri={element.illustrationUrl} width={175} height={175} />
      <View style={styles.titleRow}>
        {hasAudio && <PlayAudioButton onPress={play} />}
        <HintText
          content={element.learningLanguageTitleContent}
          audioRange={audioRange}
          rtl={rtl}
          centered
          style={{
            fontSize: fontSizes.title,
            fontWeight: "700",
            color: colors.text,
          }}
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
});
