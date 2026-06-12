import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../../theme";
import { HintText } from "../HintText";
import type { ContentWithHints } from "../types";

export function QuestionPrompt({
  question,
}: {
  question: ContentWithHints | string | undefined;
}) {
  if (!question) return null;
  const content: ContentWithHints =
    typeof question === "string"
      ? { text: question, hintMap: [] }
      : question;
  return (
    <View style={styles.root}>
      <HintText content={content} style={styles.text} />
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
