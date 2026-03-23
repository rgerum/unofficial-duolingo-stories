import React from "react";
import { produce } from "immer";
import styles from "./StoryQuestionMatch.module.css";
import { shuffle } from "@/lib/shuffle";
import { playSoundEffect } from "@/lib/sound-effects";
import { isTypingTarget } from "@/lib/is-typing-target";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import WordButton from "../WordButton";
import { StoryElement } from "@/components/editor/story/syntax_parser_types";

type WordState = "idle" | "selected" | "right" | "wrong";

interface Word {
  value: string;
  state: WordState;
  index: number;
  key: string;
}

interface State {
  lists: Word[][];
}

type SelectionOutcome = "noop" | "selected" | "right" | "wrong";

interface SelectionResult {
  nextState: State;
  outcome: SelectionOutcome;
}

type Action = {
  type: "select";
  listIndex: number;
  wordIndex: number;
  key: string;
};

/*
The MATCH question.
It consists of two columns of buttons. The learner needs to find the right pars.

[MATCH]
> Tap the pairs
- estás <> you are
- mucho <> a lot
- es <> is
- las llaves <> the keys
- la <> the
 */

function applySelection(currentState: State, action: Action): SelectionResult {
  let outcome: SelectionOutcome = "noop";

  const nextState = produce(currentState, (draftState) => {
    switch (action.type) {
      case "select": {
        // the word in the other group
        const selectedWord = draftState.lists[[1, 0][action.listIndex]].find(
          (word) => word.state === "selected",
        );
        // the selected word in the current group
        const selectedWordSame = draftState.lists[action.listIndex].find(
          (word) => word.state === "selected",
        );
        // the newly selected word
        const newSelectedWord =
          draftState.lists[action.listIndex][action.wordIndex];

        // if the newly selected word is already done, skip
        if (newSelectedWord.state === "right") {
          return;
        }

        // if there is a word selected in the current group, we change the selection
        if (selectedWordSame) {
          // unselect the old word
          selectedWordSame.state = "idle";

          // if it's the same word, return
          if (selectedWordSame.index === newSelectedWord.index) {
            return;
          }
        }

        // if it's the only selected word, select it
        if (!selectedWord) {
          newSelectedWord.state = "selected";
          outcome = "selected";
        }
        // if the words match
        else if (selectedWord.index === newSelectedWord.index) {
          selectedWord.state = "right";
          newSelectedWord.state = "right";
          outcome = "right";
        }
        // if the words do not match
        else {
          selectedWord.state = "wrong";
          selectedWord.key = action.key;
          newSelectedWord.state = "wrong";
          newSelectedWord.key = action.key;
          outcome = "wrong";
        }

        break;
      }
    }
  });

  return { nextState, outcome };
}

function reducer(currentState: State, action: Action) {
  return applySelection(currentState, action).nextState;
}

function shuffle_lists(state: State) {
  return { lists: state.lists.map((element) => shuffle(element)) };
}

function getNumberIndex(key: string) {
  if (key === "0") return 9;
  const parsed = Number.parseInt(key, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 9) return undefined;
  return parsed - 1;
}

function StoryQuestionMatch({
  /*progress,*/ element,
  active,
  setDone,
}: {
  element: StoryElement;
  active: boolean;
  setDone: () => void;
}) {
  if (element.type !== "MATCH") throw new Error("not the right element");
  const [state, dispatch]: [State, React.Dispatch<Action>] = React.useReducer(
    reducer,
    {
      lists: [
        element.fallbackHints.map((e, i) => ({
          value: e.phrase,
          state: "idle" as const,
          index: i,
          key: crypto.randomUUID(),
        })),
        element.fallbackHints.map((e, i) => ({
          value: e.translation,
          state: "idle" as const,
          index: i,
          key: crypto.randomUUID(),
        })),
      ],
    },
    shuffle_lists,
  );

  const selectWord = React.useCallback(
    (listIndex: number, wordIndex: number) => {
      const action = {
        type: "select",
        listIndex,
        wordIndex,
        key: crypto.randomUUID(),
      } as const;
      const { outcome } = applySelection(state, action);

      if (outcome === "wrong") {
        playSoundEffect("wrong");
      }

      dispatch(action);
    },
    [state],
  );

  React.useEffect(() => {
    const all_right = state.lists[0].every((word) => word.state === "right");
    if (all_right) setDone();
  }, [state, setDone]);
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || !active || isTypingTarget(event.target)) return;

      const wordIndex = getNumberIndex(event.key);
      if (wordIndex === undefined) return;

      const selectedLeft = state.lists[0].some(
        (word) => word.state === "selected",
      );
      const selectedRight = state.lists[1].some(
        (word) => word.state === "selected",
      );
      const listIndex = selectedLeft && !selectedRight ? 1 : 0;
      const word = state.lists[listIndex][wordIndex];

      if (!word || word.state === "right") return;

      event.preventDefault();
      selectWord(listIndex, wordIndex);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, selectWord, state]);

  return (
    <div>
      <StoryQuestionPrompt
        question={element.prompt}
        lang={element.lang_question}
      />
      <div className={styles.match_container}>
        {state.lists.map((list, listIndex) => (
          <div key={listIndex} className={styles.match_col}>
            {list.map((word, wordIndex) => (
              <WordButton
                key={word.key}
                status={word.state}
                onClick={() => selectWord(listIndex, wordIndex)}
              >
                {word.value}
              </WordButton>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default StoryQuestionMatch;
