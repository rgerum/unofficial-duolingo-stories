import React from "react";
import { produce } from "immer";
import styles from "./StoryQuestionMatch.module.css";
//import {EditorContext, StoryContext} from "../story/story";
//import styles_common from "../story/common.module.css";
//import {shuffle} from "../story/includes";
import { shuffle } from "../story/includes";
//import {EditorHook} from "../story/editor_hooks";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import WordButton from "../WordButton";

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

function reducer(currentState, action) {
  return produce(currentState, (draftState) => {
    switch (action.type) {
      case "select": {
        // the word in the other group
        const selectedWord = draftState.lists[[1, 0][action.listIndex]].find(
          (word) => word.state === "selected",
        );
        // the selected word in the current group
        const selectedWord_same = draftState.lists[
          [0, 1][action.listIndex]
        ].find((word) => word.state === "selected");
        // the newly selected word
        const newSelectedWord =
          draftState.lists[action.listIndex][action.wordIndex];

        // if the newly selected word is already done, skip
        if (newSelectedWord.state === "right") {
          return;
        }

        // if there is a word selected in the current group, we change the selection
        if (selectedWord_same) {
          // unselect the old word
          selectedWord_same.state = "idle";

          // if it's the same word, return
          if (selectedWord_same?.index === newSelectedWord?.index) {
            return;
          }
        }

        // if it's the only selected word, select it
        if (!selectedWord) {
          newSelectedWord.state = "selected";
        }
        // if the words match
        else if (selectedWord.index === newSelectedWord.index) {
          selectedWord.state = "right";
          newSelectedWord.state = "right";
        }
        // if the words do not match
        else {
          selectedWord.state = "wrong";
          selectedWord.key = action.key;
          newSelectedWord.state = "wrong";
          newSelectedWord.key = action.key;
        }

        break;
      }
    }
  });
}

function shuffle_lists(state) {
  return { lists: state.lists.map((element) => shuffle(element)) };
}

function StoryQuestionMatch({ /*progress,*/ element }) {
  const [state, dispatch] = React.useReducer(
    reducer,
    {
      lists: [
        element.fallbackHints.map((e, i) => {
          return {
            value: e.phrase,
            state: "idle",
            index: i,
            key: crypto.randomUUID(),
          };
        }),
        element.fallbackHints.map((e, i) => {
          return {
            value: e.translation,
            state: "idle",
            index: i,
            key: crypto.randomUUID(),
          };
        }),
      ],
    },
    shuffle_lists,
  );

  return (
    <div className={styles.match_container}>
      {state.lists.map((list, listIndex) => (
        <div key={listIndex} className={styles.match_col}>
          {list.map((word, wordIndex) => (
            <WordButton
              key={word.key}
              status={word.state}
              onClick={() =>
                dispatch({
                  type: "select",
                  listIndex,
                  wordIndex,
                  key: crypto.randomUUID(),
                })
              }
            >
              {word.value}
            </WordButton>
          ))}
        </div>
      ))}
    </div>
  );
}

export default StoryQuestionMatch;
