import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../../theme";
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
  if (!question) return null;
  const content: ContentWithHints =
    typeof question === "string"
      ? { text: question, hintMap: [] }
      : question;
  return (
    <View style={styles.root}>
      <HintText
        content={content}
        style={[styles.text, getLanguageTextStyle(lang, styles.text)]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
