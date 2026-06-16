import React from "react";
import { StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { playSoundEffect } from "../soundEffects";
import { WordChip, type ChipStatus } from "../WordChip";
import { QuestionPrompt } from "./QuestionPrompt";
import type { StoryElementMatch } from "../types";

type WordState = "idle" | "selected" | "right" | "wrong";

type Word = {
  value: string;
  state: WordState;
  index: number;
  key: string;
};

function shuffle<T>(list: T[]): T[] {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Tap-the-pairs challenge, ported from the web's StoryQuestionMatch reducer:
 * select one word per column; matches lock green, mismatches flash red.
 */
export function MatchQuestion({
  element,
  setDone,
}: {
  element: StoryElementMatch;
  setDone: () => void;
}) {
  const [lists, setLists] = React.useState<Word[][]>(() => [
    shuffle(
      element.fallbackHints.map((hint, i) => ({
        value: hint.phrase,
        state: "idle" as const,
        index: i,
        key: `left-${i}`,
      })),
    ),
    shuffle(
      element.fallbackHints.map((hint, i) => ({
        value: hint.translation,
        state: "idle" as const,
        index: i,
        key: `right-${i}`,
      })),
    ),
  ]);
  const doneRef = React.useRef(false);

  const selectWord = (listIndex: number, wordIndex: number) => {
    setLists((current) => {
      const next = current.map((list) => list.map((word) => ({ ...word })));
      const otherList = next[listIndex === 0 ? 1 : 0];
      const sameList = next[listIndex];
      const selectedOther = otherList.find((w) => w.state === "selected");
      const selectedSame = sameList.find((w) => w.state === "selected");
      const newWord = sameList[wordIndex];

      if (newWord.state === "right") return current;

      // wrong-flash words go back to idle on the next interaction
      for (const list of next)
        for (const word of list)
          if (word.state === "wrong") word.state = "idle";

      if (selectedSame) {
        selectedSame.state = "idle";
        if (selectedSame.index === newWord.index) return next;
      }

      if (!selectedOther) {
        newWord.state = "selected";
      } else if (selectedOther.index === newWord.index) {
        selectedOther.state = "right";
        newWord.state = "right";
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        selectedOther.state = "wrong";
        newWord.state = "wrong";
        playSoundEffect("wrong");
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return next;
    });
  };

  React.useEffect(() => {
    const allRight = lists[0].every((word) => word.state === "right");
    if (allRight && !doneRef.current) {
      doneRef.current = true;
      setDone();
    }
  }, [lists, setDone]);

  return (
    <View>
      <QuestionPrompt question={element.prompt} lang={element.lang_question} />
      <View style={styles.columns}>
        {lists.map((list, listIndex) => (
          <View key={listIndex} style={styles.column}>
            {list.map((word, wordIndex) => (
              <WordChip
                key={word.key}
                block
                status={
                  word.state === "idle" ? undefined : (word.state as ChipStatus)
                }
                onPress={() => selectWord(listIndex, wordIndex)}
                labelLang={
                  listIndex === 0 ? element.lang : element.lang_question
                }
              >
                {word.value}
              </WordChip>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  column: {
    flex: 1,
  },
});
