import React from "react";
import { StyleSheet, View } from "react-native";
import { playSoundEffect } from "../soundEffects";
import { playErrorHaptic, playSelectionHaptic } from "../storyHaptics";
import { WordChip, type ChipStatus } from "../WordChip";
import { QuestionPrompt } from "./QuestionPrompt";
import type { StoryElementMatch } from "../types";

type WordState = "idle" | "selected" | "right" | "matched" | "wrong";

type Word = {
  value: string;
  state: WordState;
  index: number;
  key: string;
  matchKey?: string;
  settled?: boolean;
  wrongKey?: string;
};

const WRONG_FLASH_DELAY_MS = 820;
const RIGHT_GREEN_HOLD_MS = 1000;

function shuffle<T>(list: T[], random: () => number): T[] {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
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
  debugRandom,
  debugForcedStates,
}: {
  element: StoryElementMatch;
  setDone: () => void;
  debugRandom?: () => number;
  debugForcedStates?: Record<string, WordState>;
}) {
  const [lists, setLists] = React.useState<Word[][]>(() => [
    shuffle(
      element.fallbackHints.map((hint, i) => ({
        value: hint.phrase,
        state: debugForcedStates?.[hint.phrase] ?? ("idle" as const),
        index: i,
        key: `left-${i}`,
        settled: debugForcedStates?.[hint.phrase] === "matched",
      })),
      debugRandom ?? Math.random,
    ),
    shuffle(
      element.fallbackHints.map((hint, i) => ({
        value: hint.translation,
        state: debugForcedStates?.[hint.translation] ?? ("idle" as const),
        index: i,
        key: `right-${i}`,
        settled: debugForcedStates?.[hint.translation] === "matched",
      })),
      debugRandom ?? Math.random,
    ),
  ]);
  const doneRef = React.useRef(false);
  const matchAttemptRef = React.useRef(0);
  const wrongAttemptRef = React.useRef(0);
  const resetTimers = React.useRef(new Set<ReturnType<typeof setTimeout>>());

  React.useEffect(() => {
    return () => {
      for (const timer of resetTimers.current) clearTimeout(timer);
      resetTimers.current.clear();
    };
  }, []);

  const selectWord = (listIndex: number, wordIndex: number) => {
    setLists((current) => {
      const next = current.map((list) => list.map((word) => ({ ...word })));
      const otherList = next[listIndex === 0 ? 1 : 0];
      const sameList = next[listIndex];
      const selectedOther = otherList.find((w) => w.state === "selected");
      const selectedSame = sameList.find((w) => w.state === "selected");
      const newWord = sameList[wordIndex];

      if (newWord.state === "right" || newWord.state === "matched") {
        return current;
      }

      // Clear any stale wrong feedback before processing a fresh tap.
      for (const list of next)
        for (const word of list)
          if (word.state === "wrong") {
            word.state = "idle";
            word.wrongKey = undefined;
          }

      if (selectedSame) {
        selectedSame.state = "idle";
        if (selectedSame.index === newWord.index) return next;
      }

      if (!selectedOther) {
        newWord.state = "selected";
      } else if (selectedOther.index === newWord.index) {
        const matchKey = `match-${matchAttemptRef.current++}`;
        selectedOther.state = "right";
        selectedOther.matchKey = matchKey;
        selectedOther.settled = false;
        newWord.state = "right";
        newWord.matchKey = matchKey;
        newWord.settled = false;
        const timer = setTimeout(() => {
          resetTimers.current.delete(timer);
          setLists((state) =>
            state.map((list) =>
              list.map((word) =>
                word.state === "right" && word.matchKey === matchKey
                  ? { ...word, settled: true }
                  : word,
              ),
            ),
          );
        }, RIGHT_GREEN_HOLD_MS);
        resetTimers.current.add(timer);
        playSelectionHaptic();
      } else {
        const wrongKey = `wrong-${wrongAttemptRef.current++}`;
        selectedOther.state = "wrong";
        selectedOther.wrongKey = wrongKey;
        newWord.state = "wrong";
        newWord.wrongKey = wrongKey;
        const timer = setTimeout(() => {
          resetTimers.current.delete(timer);
          setLists((state) =>
            state.map((list) =>
              list.map((word) =>
                word.state === "wrong" && word.wrongKey === wrongKey
                  ? { ...word, state: "idle", wrongKey: undefined }
                  : word,
              ),
            ),
          );
        }, WRONG_FLASH_DELAY_MS);
        resetTimers.current.add(timer);
        playSoundEffect("wrong");
        playErrorHaptic();
      }
      return next;
    });
  };

  React.useEffect(() => {
    const allRight = lists[0].every(
      (word) => word.state === "right" || word.state === "matched",
    );
    if (allRight && !doneRef.current) {
      doneRef.current = true;
      setDone();
    }
  }, [lists, setDone]);

  const getChipStatus = (word: Word): ChipStatus => {
    if (word.state === "idle") return undefined;
    if (word.state === "matched" || (word.state === "right" && word.settled)) {
      return "matched";
    }
    return word.state;
  };

  return (
    <View>
      <QuestionPrompt question={element.prompt} lang={element.lang_question} />
      <View style={styles.columns}>
        {lists.map((list, listIndex) => (
          <View key={listIndex} style={styles.column}>
            {list.map((word, wordIndex) => {
              const chipStatus = getChipStatus(word);
              return (
                <WordChip
                  key={word.key}
                  block
                  status={chipStatus}
                  onPress={
                    chipStatus === "right" || chipStatus === "matched"
                      ? undefined
                      : () => selectWord(listIndex, wordIndex)
                  }
                  labelLang={
                    listIndex === 0 ? element.lang : element.lang_question
                  }
                >
                  {word.value}
                </WordChip>
              );
            })}
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
