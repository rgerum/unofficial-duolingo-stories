import {
  Platform,
  StyleSheet,
  type StyleProp,
  type TextStyle,
} from "react-native";

export const SITELEN_PONA_LANG = "tok2";
export const SITELEN_PONA_FONT_FAMILY = "linja-pona";
export const TELUGU_LANG = "te";
export const TELUGU_FONT_FAMILY = Platform.select({
  ios: "Telugu Sangam MN",
  android: "sans-serif",
  default: undefined,
});

export function getLanguageTextStyle(
  lang?: string,
  baseStyle?: StyleProp<TextStyle>,
): TextStyle | undefined {
  if (lang === TELUGU_LANG) {
    const flatStyle = StyleSheet.flatten(baseStyle);
    const lineHeight =
      typeof flatStyle?.fontSize === "number"
        ? { lineHeight: Math.ceil(flatStyle.fontSize * 1.55) }
        : undefined;

    return {
      ...(TELUGU_FONT_FAMILY ? { fontFamily: TELUGU_FONT_FAMILY } : null),
      fontWeight: "400",
      ...lineHeight,
    };
  }

  if (lang !== SITELEN_PONA_LANG) return undefined;

  const flatStyle = StyleSheet.flatten(baseStyle);
  const fontSize =
    typeof flatStyle?.fontSize === "number"
      ? { fontSize: flatStyle.fontSize * 1.5 }
      : undefined;
  const lineHeight =
    typeof flatStyle?.lineHeight === "number"
      ? { lineHeight: flatStyle.lineHeight * 1.5 }
      : undefined;

  return {
    fontFamily: SITELEN_PONA_FONT_FAMILY,
    fontWeight: "400",
    ...fontSize,
    ...lineHeight,
  };
}
