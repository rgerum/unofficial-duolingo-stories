import { StyleSheet, type StyleProp, type TextStyle } from "react-native";

export const SITELEN_PONA_LANG = "tok2";
export const SITELEN_PONA_FONT_FAMILY = "linja-pona";

export function getLanguageTextStyle(
  lang?: string,
  baseStyle?: StyleProp<TextStyle>,
): TextStyle | undefined {
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
