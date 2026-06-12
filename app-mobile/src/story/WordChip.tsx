import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "../theme";

/**
 * Word-bank / answer chip with the same states as the web's WordButton:
 * idle, selected, right (green), wrong (red), off/done (used, grayed out).
 *
 * Built as two layers (edge box behind a face that slides down on press) so
 * the 3D press effect never changes layout.
 */
export type ChipStatus =
  | "idle"
  | "selected"
  | "right"
  | "right-stay"
  | "wrong"
  | "false"
  | "off"
  | "done"
  | undefined;

const EDGE = 4;

export function WordChip({
  children,
  status,
  onPress,
  block = false,
  style,
}: {
  children: React.ReactNode;
  status: ChipStatus;
  onPress?: () => void;
  block?: boolean;
  style?: ViewStyle;
}) {
  const normalized =
    status === "false" ? "wrong" : status === "done" ? "off" : status;

  const palette = (() => {
    switch (normalized) {
      case "right":
      case "right-stay":
        return {
          face: colors.greenLight,
          border: colors.green,
          edge: colors.green,
          text: colors.greenDark,
        };
      case "wrong":
        return {
          face: colors.redLight,
          border: colors.red,
          edge: colors.red,
          text: colors.red,
        };
      case "selected":
        return {
          face: colors.blueLight,
          border: colors.blue,
          edge: colors.blue,
          text: colors.blueDark,
        };
      case "off":
        return {
          face: colors.disabledBackground,
          border: colors.disabledBackground,
          edge: colors.disabledBackground,
          text: colors.disabledBackground,
        };
      default:
        return {
          face: "#ffffff",
          border: colors.border,
          edge: colors.border,
          text: colors.text,
        };
    }
  })();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.wrap, block && styles.block, style]}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.edge, { backgroundColor: palette.edge }]} />
          <View
            style={[
              styles.face,
              block && styles.blockFace,
              {
                backgroundColor: palette.face,
                borderColor: palette.border,
                transform: [{ translateY: pressed ? EDGE : 0 }],
              },
            ]}
          >
            <Text style={[styles.label, { color: palette.text }]}>
              {children}
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
    margin: 4,
    alignSelf: "flex-start",
  },
  block: {
    alignSelf: "stretch",
    marginHorizontal: 0,
    marginVertical: 5,
  },
  edge: {
    position: "absolute",
    top: EDGE,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  face: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  blockFace: {
    alignItems: "center",
  },
  label: {
    fontSize: 18,
    color: colors.text,
  },
});
