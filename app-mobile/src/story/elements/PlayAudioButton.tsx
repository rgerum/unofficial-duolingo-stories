import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export function PlayAudioButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Play audio"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.root, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name="volume-medium" size={22} color={colors.blue} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    marginRight: 8,
    marginTop: 2,
  },
});
