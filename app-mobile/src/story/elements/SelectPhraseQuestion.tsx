import React from "react";
import { StyleSheet, View } from "react-native";
import { WordChip } from "../WordChip";
import { useChoiceButtons, type ChoiceState } from "../useChoiceButtons";
import type { StoryElementSelectPhrase } from "../types";

export function SelectPhraseQuestion({
  element,
  advance,
  debugInitialState,
}: {
  element: StoryElementSelectPhrase;
  advance: () => void;
  debugInitialState?: ChoiceState[];
}) {
  const [buttonState, click] = useChoiceButtons(
    element.answers.length,
    element.correctAnswerIndex,
    advance,
    debugInitialState,
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
            labelLang={element.lang}
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
