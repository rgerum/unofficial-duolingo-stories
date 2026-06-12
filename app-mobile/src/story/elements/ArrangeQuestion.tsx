import React from "react";
import { StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { playSoundEffect } from "../soundEffects";
import { WordChip } from "../WordChip";
import type { StoryElementArrange } from "../types";

/**
 * Word-bank challenge: tap the phrases in the right order. Ported from the
 * web's StoryQuestionArrange — correctly tapped chips gray out and reveal the
 * hidden line text up to the matching character position.
 */
export function ArrangeQuestion({
  element,
  advance,
}: {
  element: StoryElementArrange;
  /** advance(charPosition, done) — reveals the line text as words are placed */
  advance: (charPosition: number, done: boolean) => void;
}) {
  const characterPositions = element.characterPositions;
  // 0 = available, 1 = used, 2 = briefly wrong
  const [buttonState, setButtonState] = React.useState<number[]>(() =>
    new Array(element.phraseOrder.length).fill(0),
  );
  const [position, setPosition] = React.useState(0);

  const click = (index: number) => {
    if (buttonState[index] === 1) return;

    if (position === element.phraseOrder[index]) {
      const done = position === element.phraseOrder.length - 1;
      advance(characterPositions?.[position] ?? 0, done);
      setButtonState((state) =>
        state.map((value, i) => (i === index ? 1 : value)),
      );
      setPosition(position + 1);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setButtonState((state) =>
        state.map((value, i) => (i === index ? 2 : value)),
      );
      setTimeout(() => {
        setButtonState((state) =>
          state.map((value, i) => (i === index && value === 2 ? 0 : value)),
        );
      }, 820);
      playSoundEffect("wrong");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={styles.root}>
      {element.selectablePhrases.map((phrase, index) => (
        <WordChip
          key={index}
          status={(["idle", "off", "wrong"] as const)[buttonState[index]]}
          onPress={() => click(index)}
        >
          {phrase}
        </WordChip>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 12,
  },
});
