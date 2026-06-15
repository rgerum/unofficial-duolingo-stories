import React from "react";
import { StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { playSoundEffect } from "../soundEffects";
import { WordChip, type ChipStatus } from "../WordChip";
import type { StoryElementArrange } from "../types";

type ButtonState = 0 | 1 | 2;

const STATUS_MAP: Record<ButtonState, ChipStatus> = {
  0: "idle",
  1: "off",
  2: "wrong",
};

// Delay matches the wrong-answer flash animation before the chip resets.
const WRONG_FLASH_DELAY_MS = 820;

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
  const [buttonState, setButtonState] = React.useState<ButtonState[]>(() =>
    new Array(element.phraseOrder.length).fill(0),
  );
  const [position, setPosition] = React.useState(0);
  const resetTimers = React.useRef(new Set<ReturnType<typeof setTimeout>>());

  React.useEffect(() => {
    return () => {
      for (const timer of resetTimers.current) clearTimeout(timer);
      resetTimers.current.clear();
    };
  }, []);

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
      const timer = setTimeout(() => {
        resetTimers.current.delete(timer);
        setButtonState((state) =>
          state.map((value, i) => (i === index && value === 2 ? 0 : value)),
        );
      }, WRONG_FLASH_DELAY_MS);
      resetTimers.current.add(timer);
      playSoundEffect("wrong");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={styles.root}>
      {element.selectablePhrases.map((phrase, index) => (
        <WordChip
          key={index}
          status={STATUS_MAP[buttonState[index]]}
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
