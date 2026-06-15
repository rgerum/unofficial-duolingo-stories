import React from "react";
import { StyleSheet, View } from "react-native";
import { WordChip } from "../WordChip";
import { useChoiceButtons } from "../useChoiceButtons";
import type { StoryElementSelectPhrase } from "../types";

export function SelectPhraseQuestion({
  element,
  advance,
}: {
  element: StoryElementSelectPhrase;
  advance: () => void;
}) {
  const [buttonState, click] = useChoiceButtons(
    element.answers.length,
    element.correctAnswerIndex,
    advance,
  );

  return (
    <View style={styles.container}>
      {element.answers.map((answer, index) => {
        const label =
          typeof answer === "string"
            ? answer.replace(/\{.*?}/g, "")
            : answer.text.replace(/\{.*?}/g, "");
        const status =
          buttonState[index] === "right" ? "right-stay" : buttonState[index];
        return (
          <WordChip
            key={index}
            block
            status={status}
            onPress={() => click(index)}
          >
            {label}
          </WordChip>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
});
