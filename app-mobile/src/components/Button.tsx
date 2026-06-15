import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "../theme";

type Variant = "primary" | "secondary" | "neutral" | "danger";

// 3D button: a dark "edge" box sits behind the face, and pressing slides the
// face down over it (transform only — the wrapper never changes size, so
// presses cause no layout shift).
const EDGE = 4;

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const palette = {
    primary: {
      face: colors.green,
      edge: colors.greenDark,
      border: "transparent",
      text: "#ffffff",
    },
    secondary: {
      face: "#ffffff",
      edge: colors.border,
      border: colors.border,
      text: colors.blue,
    },
    neutral: {
      face: "#ffffff",
      edge: colors.border,
      border: colors.border,
      text: colors.text,
    },
    danger: {
      face: "#ffffff",
      edge: colors.border,
      border: colors.border,
      text: colors.red,
    },
  }[variant];

  const face = disabled ? colors.disabledBackground : palette.face;
  const edge = disabled ? colors.disabledBackground : palette.edge;
  const border = disabled ? "transparent" : palette.border;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.wrap, style]}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.edge, { backgroundColor: edge }]} />
          <View
            style={[
              styles.face,
              {
                backgroundColor: face,
                borderColor: border,
                transform: [{ translateY: pressed && !disabled ? EDGE : 0 }],
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: disabled ? colors.disabled : palette.text },
              ]}
            >
              {title}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: EDGE,
  },
  edge: {
    position: "absolute",
    top: EDGE,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  face: {
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 17,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
