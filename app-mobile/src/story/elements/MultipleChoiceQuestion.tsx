import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fontSizes, type ThemeColors, useTheme } from "../../theme";
import { Text } from "../../components/Text";
import { HintText } from "../HintText";
import { getLanguageTextStyle } from "../languageStyles";
import { useChoiceButtons, type ChoiceState } from "../useChoiceButtons";
import { QuestionPrompt } from "./QuestionPrompt";
import type { StoryElementMultipleChoice } from "../types";

function CheckCircle({
  colors,
  state,
  styles,
}: {
  colors: ThemeColors;
  state: ChoiceState;
  styles: ReturnType<typeof createStyles>;
}) {
  if (state === "right") {
    return (
      <View style={[styles.circle, styles.circleRight]}>
        <Ionicons name="checkmark" size={20} color={colors.primaryText} />
      </View>
    );
  }
  if (state === "false") {
    return (
      <View style={[styles.circle, styles.circleWrong]}>
        <Ionicons name="close" size={20} color={colors.primaryText} />
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
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [buttonState, click] = useChoiceButtons(
    element.answers.length,
    element.correctAnswerIndex,
    advance,
  );

  return (
    <View>
      {element.question && (
        <QuestionPrompt question={element.question} lang={element.lang} />
      )}
      {element.answers.map((answer, index) => {
        const state = buttonState[index];
        const dimmed = state === "false" || state === "done";
        const answerStyle = [
          styles.answerLabel,
          getLanguageTextStyle(element.lang, styles.answerLabel),
          dimmed && styles.answerDimmed,
        ];
        return (
          <Pressable
            key={index}
            accessibilityRole="button"
            onPress={() => click(index)}
            style={styles.answerRow}
          >
            <CheckCircle colors={colors} state={state} styles={styles} />
            <View style={styles.answerText}>
              {typeof answer === "string" ? (
                <Text style={answerStyle}>{answer}</Text>
              ) : (
                <HintText content={answer} style={answerStyle} />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
}
