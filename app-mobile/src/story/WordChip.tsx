import React from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { type ThemeColors, useTheme } from "../theme";
import { Text } from "../components/Text";
import { getLanguageTextStyle } from "./languageStyles";

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
  | "matched"
  | "wrong"
  | "false"
  | "off"
  | "done"
  | undefined;

const EDGE = 4;
const MATCHED_FADE_MS = 500;

function createPalettes(colors: ThemeColors) {
  return {
  idle: {
    face: colors.surface,
    border: colors.border,
    edge: colors.border,
    text: colors.text,
  },
  right: {
    face: colors.greenLight,
    border: colors.green,
    edge: colors.green,
    text: colors.greenDark,
  },
  wrong: {
    face: colors.redLight,
    border: colors.red,
    edge: colors.red,
    text: colors.red,
  },
  selected: {
    face: colors.blueLight,
    border: colors.blue,
    edge: colors.blue,
    text: colors.blueDark,
  },
  off: {
    face: colors.disabledBackground,
    border: colors.disabledBackground,
    edge: colors.disabledBackground,
    text: colors.disabledBackground,
  },
  matched: {
    face: colors.disabledBackground,
    border: colors.disabledBackground,
    edge: colors.disabledBackground,
    text: colors.disabled,
  },
  };
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export function WordChip({
  children,
  status,
  onPress,
  block = false,
  style,
  labelLang,
  labelStyle,
}: {
  children: React.ReactNode;
  status: ChipStatus;
  onPress?: () => void;
  block?: boolean;
  style?: ViewStyle;
  labelLang?: string;
  labelStyle?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  const palettes = React.useMemo(() => createPalettes(colors), [colors]);
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const normalized =
    status === "false" ? "wrong" : status === "done" ? "off" : status;
  const matchedProgress = React.useRef(
    new Animated.Value(normalized === "matched" ? 1 : 0),
  ).current;
  const previousNormalized = React.useRef(normalized);

  React.useEffect(() => {
    if (normalized === "matched") {
      if (previousNormalized.current === "matched") {
        matchedProgress.setValue(1);
        return;
      }
      matchedProgress.setValue(0);
      const animation = Animated.timing(matchedProgress, {
        toValue: 1,
        duration: MATCHED_FADE_MS,
        useNativeDriver: false,
      });
      animation.start();
      previousNormalized.current = normalized;
      return () => animation.stop();
    }
    matchedProgress.setValue(0);
    previousNormalized.current = normalized;
  }, [matchedProgress, normalized]);

  const palette = (() => {
    switch (normalized) {
      case "right":
      case "right-stay":
        return palettes.right;
      case "wrong":
        return palettes.wrong;
      case "selected":
        return palettes.selected;
      case "off":
        return palettes.off;
      case "matched":
        return {
          face: matchedProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [palettes.right.face, palettes.matched.face],
          }),
          border: matchedProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [palettes.right.border, palettes.matched.border],
          }),
          edge: matchedProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [palettes.right.edge, palettes.matched.edge],
          }),
          text: matchedProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [palettes.right.text, palettes.matched.text],
          }),
        };
      default:
        return palettes.idle;
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
          {/*
            Web matched chips finish pressed down, with the face covering the
            lower edge. Interpolate that motion together with the grey fade.
          */}
          <Animated.View
            style={[styles.edge, { backgroundColor: palette.edge }]}
          />
          <Animated.View
            style={[
              styles.face,
              block && styles.blockFace,
              {
                backgroundColor: palette.face,
                borderColor: palette.border,
                transform: [
                  {
                    translateY:
                      normalized === "matched"
                        ? matchedProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [pressed ? EDGE : 0, EDGE],
                          })
                        : pressed
                          ? EDGE
                          : 0,
                  },
                ],
              },
            ]}
          >
            <AnimatedText
              style={[
                styles.label,
                getLanguageTextStyle(labelLang, styles.label),
                labelStyle,
                { color: palette.text },
              ]}
            >
              {children}
            </AnimatedText>
          </Animated.View>
        </>
      )}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
}
