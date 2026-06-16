import React from "react";
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from "react-native";

export const NUNITO_FONT_FAMILY = "Nunito";
export const NUNITO_BOLD_FONT_FAMILY = "Nunito-Bold";
export const NUNITO_LIGHT_FONT_FAMILY = "Nunito-Light";

function getNunitoFamily(style: TextProps["style"]): string | undefined {
  const flatStyle = StyleSheet.flatten(style) as TextStyle | undefined;
  if (flatStyle?.fontFamily) return undefined;

  const weight = flatStyle?.fontWeight;
  if (weight === "300" || weight === 300 || weight === "200" || weight === 200)
    return NUNITO_LIGHT_FONT_FAMILY;
  if (
    weight === "600" ||
    weight === 600 ||
    weight === "700" ||
    weight === 700 ||
    weight === "800" ||
    weight === 800 ||
    weight === "900" ||
    weight === 900 ||
    weight === "bold"
  )
    return NUNITO_BOLD_FONT_FAMILY;
  return NUNITO_FONT_FAMILY;
}

function getFontStyle(style: TextProps["style"]): TextStyle | undefined {
  const fontFamily = getNunitoFamily(style);
  if (!fontFamily) return undefined;
  return { fontFamily, fontWeight: "400" };
}

export function Text({ style, ...props }: TextProps) {
  return <NativeText {...props} style={[style, getFontStyle(style)]} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  return <NativeTextInput {...props} style={[style, getFontStyle(style)]} />;
}
