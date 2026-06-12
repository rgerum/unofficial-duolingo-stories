import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSizes } from "../../theme";
import { HintText } from "../HintText";
import { useChoiceButtons, type ChoiceState } from "../useChoiceButtons";
import { QuestionPrompt } from "./QuestionPrompt";
import type { StoryElementMultipleChoice } from "../types";

function CheckCircle({ state }: { state: ChoiceState }) {
  if (state === "right") {
    return (
      <View style={[styles.circle, styles.circleRight]}>
        <Ionicons name="checkmark" size={20} color="#ffffff" />
      </View>
    );
  }
  if (state === "false") {
    return (
      <View style={[styles.circle, styles.circleWrong]}>
        <Ionicons name="close" size={20} color="#ffffff" />
      </View>
    );
  }
  return (
    <View style={[styles.circle, state === "done" && styles.circleDone]} />
  );
}

export function MultipleChoiceQuestion({
  element,
  advance,
}: {
  element: StoryElementMultipleChoice;
  advance: () => void;
}) {
  const [buttonState, click] = useChoiceButtons(
    element.answers.length,
    element.correctAnswerIndex,
    advance,
  );

  return (
    <View>
      {element.question && <QuestionPrompt question={element.question} />}
      {element.answers.map((answer, index) => {
        const state = buttonState[index];
        const dimmed = state === "false" || state === "done";
        return (
          <Pressable
            key={index}
            accessibilityRole="button"
            onPress={() => click(index)}
            style={styles.answerRow}
          >
            <CheckCircle state={state} />
            <View style={styles.answerText}>
              {typeof answer === "string" ? (
                <Text
                  style={[styles.answerLabel, dimmed && styles.answerDimmed]}
                >
                  {answer}
                </Text>
              ) : (
                <HintText
                  content={answer}
                  style={[
                    styles.answerLabel,
                    ...(dimmed ? [styles.answerDimmed] : []),
                  ]}
                />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    gap: 14,
  },
  answerText: {
    flexShrink: 1,
  },
  answerLabel: {
    fontSize: fontSizes.body,
    lineHeight: 26,
    color: colors.text,
  },
  answerDimmed: {
    color: colors.disabled,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  circleRight: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  circleWrong: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  circleDone: {
    backgroundColor: colors.disabledBackground,
  },
});
