import React from "react";
import { StyleSheet, View } from "react-native";
import { type ThemeColors, useTheme } from "../../theme";
import { HintText } from "../HintText";
import { getLanguageTextStyle } from "../languageStyles";
import type { ContentWithHints } from "../types";

export function QuestionPrompt({
  question,
  lang,
}: {
  question: ContentWithHints | string | undefined;
  lang?: string;
}) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  if (!question) return null;
  const content: ContentWithHints =
    typeof question === "string" ? { text: question, hintMap: [] } : question;
  return (
    <View style={styles.root}>
      <HintText
        content={content}
        lang={lang}
        style={[styles.text, getLanguageTextStyle(lang, styles.text)]}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      marginTop: 18,
      marginBottom: 6,
    },
    text: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.textDim,
    },
  });
}
