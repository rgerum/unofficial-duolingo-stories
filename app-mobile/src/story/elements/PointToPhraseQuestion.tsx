import React from "react";
import { StyleSheet, View } from "react-native";
import { fontSizes, type ThemeColors, useTheme } from "../../theme";
import { Text } from "../../components/Text";
import { WordChip } from "../WordChip";
import { getLanguageTextStyle } from "../languageStyles";
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
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
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
      <QuestionPrompt
        question={element.question}
        lang={element.lang_question}
      />
      <View style={styles.transcript}>
        {element.transcriptParts.map((part, index) =>
          part.selectable ? (
            <WordChip
              key={index}
              status={buttonState[buttonIndices.indexOf(index)]}
              onPress={() => click(buttonIndices.indexOf(index))}
              labelLang={element.lang}
            >
              {part.text.replace(/\{.*?}/g, "")}
            </WordChip>
          ) : (
            <Text
              key={index}
              style={[
                styles.plainText,
                getLanguageTextStyle(element.lang, styles.plainText),
              ]}
            >
              {part.text}
            </Text>
          ),
        )}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
}
