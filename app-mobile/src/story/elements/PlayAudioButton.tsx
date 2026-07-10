import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme";

export const PLAY_AUDIO_ICON_NAME = "volume-medium";
export const PLAY_AUDIO_ICON_SIZE = 22;
export const PLAY_AUDIO_ICON_FONT_FAMILY = "ionicons";
export const PLAY_AUDIO_ICON_GLYPH = String.fromCodePoint(
  Number(Ionicons.getRawGlyphMap()[PLAY_AUDIO_ICON_NAME]),
);

export function PlayAudioButton({
  onPress,
  rtl = false,
}: {
  onPress: () => void;
  rtl?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Play audio"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.root,
        rtl && styles.rootRtl,
        pressed && { opacity: 0.6 },
      ]}
    >
      <Ionicons
        name={PLAY_AUDIO_ICON_NAME}
        size={PLAY_AUDIO_ICON_SIZE}
        color={colors.blue}
        style={rtl && styles.iconRtl}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    marginRight: 8,
    marginTop: 2,
  },
  rootRtl: {
    marginRight: 0,
    marginLeft: 8,
  },
  iconRtl: {
    transform: [{ scaleX: -1 }],
  },
});
