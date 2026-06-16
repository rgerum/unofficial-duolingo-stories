import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSizes } from "../../theme";
import { WordChip } from "../WordChip";
import { useChoiceButtons } from "../useChoiceButtons";
import { QuestionPrompt } from "./QuestionPrompt";
import type { StoryElementPointToPhrase } from "../types";

/** Tap the word in the transcript that answers the question. */
export function PointToPhraseQuestion({
  element,
  advance,
}: {
  element: StoryElementPointToPhrase;
  advance: () => void;
}) {
  // Dense button index -> transcript part index (only selectable parts).
  const buttonIndices: number[] = [];
  for (let index = 0; index < element.transcriptParts.length; index++) {
    if (element.transcriptParts[index].selectable) buttonIndices.push(index);
  }

  // correctAnswerIndex is already in selectable-button space, not transcript-part space.
  const [buttonState, click] = useChoiceButtons(
    buttonIndices.length,
    element.correctAnswerIndex,
    advance,
  );

  return (
    <View>
      <QuestionPrompt question={element.question} />
      <View style={styles.transcript}>
        {element.transcriptParts.map((part, index) =>
          part.selectable ? (
            <WordChip
              key={index}
              status={buttonState[buttonIndices.indexOf(index)]}
              onPress={() => click(buttonIndices.indexOf(index))}
            >
              {part.text.replace(/\{.*?}/g, "")}
            </WordChip>
          ) : (
            <Text key={index} style={styles.plainText}>
              {part.text}
            </Text>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  transcript: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 6,
  },
  plainText: {
    fontSize: fontSizes.body,
    lineHeight: 38,
    color: colors.text,
  },
});
