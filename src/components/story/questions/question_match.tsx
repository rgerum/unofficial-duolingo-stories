import React, { useEffect, useState } from "react";
import styles from "./question_match.module.css";
import styles_common from "../common.module.css";

import { shuffle } from "../includes";
import { EditorHook } from "../editor_hooks";
import { EditorContext, StoryContext } from "../story";
import QuestionPrompt from "./question_prompt";
import type { StoryElementMatch } from "@/components/editor/story/syntax_parser_types";
import type { MatchClickedState } from "../types";

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

interface QuestionMatchProps {
  progress: number;
  element: StoryElementMatch;
}

export default function QuestionMatch({
  progress,
  element,
}: QuestionMatchProps) {
  const controls = React.useContext(StoryContext);
  const editor = React.useContext(EditorContext);

  const [done, setDone] = React.useState(false);
  const active = progress === element.trackingProperties.line_index;

  useEffect(() => {
    if (active && !done && controls?.block_next) {
      controls.block_next();
    }
  }, [active, done, controls]);

  // whether this part is already shown
  let hidden2 = !active ? styles_common.hidden : "";

  const [orderA, setOrderA] = useState<number[]>([]);
  const [orderB, setOrderB] = useState<number[]>([]);
  const [clicked, setClicked] = useState<MatchClickedState[]>([]);
  const [last_clicked, setLastClicked] = useState<number | undefined>(
    undefined,
  );

  let order = orderB.concat(orderA);

  // when order is not initialized or when the number of elements changed in the editor
  if (orderA.length !== element.fallbackHints.length) {
    const newClicked: MatchClickedState[] = [];
    const newOrderA: number[] = [];
    const newOrderB: number[] = [];
    for (let i = 0; i < element.fallbackHints.length; i++) {
      newOrderA.push(i);
      newOrderB.push(i);
      newClicked.push(undefined);
      newClicked.push(undefined);
    }
    shuffle(newOrderA);
    shuffle(newOrderB);
    setOrderA(newOrderA);
    setOrderB(newOrderB);
    setClicked(newClicked);
    setLastClicked(undefined);
  }

  const click = React.useCallback(
    (index: number | string) => {
      const idx = typeof index === "string" ? parseInt(index) : index;
      // do not allow to click on finished words again
      if (clicked[idx] === "right") return;

      const newClicked = [...clicked];

      // select the word
      if (
        last_clicked === undefined ||
        idx >= orderB.length === last_clicked >= orderB.length
      ) {
        newClicked[idx] = "selected";
        if (last_clicked !== undefined) newClicked[last_clicked] = undefined;
        setLastClicked(idx);
        setClicked(newClicked);
      }
      // deselect the word
      else if (last_clicked === idx) {
        setLastClicked(undefined);
        newClicked[idx] = undefined;
        setClicked(newClicked);
      }
      // the pair is right
      else if (order[last_clicked] === order[idx]) {
        newClicked[idx] = "right";
        newClicked[last_clicked] = "right";
        setLastClicked(undefined);
        setClicked(newClicked);
        const right_count = newClicked.filter(
          (item) => item === "right",
        ).length;
        if (right_count >= newClicked.length) {
          setDone(true);
          controls?.right();
        }
      }
      // the pair is wrong
      else if (order[last_clicked] !== order[idx]) {
        const last_clicked_old = last_clicked;
        newClicked[idx] = "wrong";
        newClicked[last_clicked_old] = "wrong";
        setLastClicked(undefined);
        setClicked(newClicked);
        setTimeout(() => {
          setClicked((prev) => {
            const updated = [...prev];
            if (updated[idx] === "wrong") updated[idx] = undefined;
            if (updated[last_clicked_old] === "wrong")
              updated[last_clicked_old] = undefined;
            return updated;
          });
        }, 1500);
      }
    },
    [
      clicked,
      last_clicked,
      orderB,
      setLastClicked,
      setClicked,
      setDone,
      order,
      controls,
    ],
  );

  const key_event_handler = React.useCallback(
    (e: KeyboardEvent) => {
      let value = parseInt(e.key) - 1;
      if (value === -1) value = 9;
      if (value < orderA.length + orderB.length) click(value);
    },
    [click, orderA.length, orderB.length],
  );
  React.useEffect(() => {
    if (active) {
      window.addEventListener("keypress", key_event_handler);
      return () => window.removeEventListener("keypress", key_event_handler);
    }
  }, [key_event_handler, active]);

  let onClick: (() => void) | undefined;
  [hidden2, onClick] = EditorHook(hidden2, element.editor, editor);

  function get_color(state: MatchClickedState): string {
    if (state === "right") return styles.right;
    if (state === "wrong") return styles.wrong;
    if (state === "selected") return styles.selected;
    return styles.default;
  }

  return (
    <div
      className={styles_common.fadeGlideIn + " " + hidden2}
      onClick={onClick}
      data-lineno={element?.editor?.block_start_no}
    >
      <QuestionPrompt question={element.prompt} lang={element.lang_question} />
      <div className={styles.match_container}>
        <div className="match_col">
          {orderB.map((phrase: number, index: number) => (
            <div key={index} className={styles.test + " " + element.lang}>
              <button
                key={index}
                className={
                  element.lang +
                  " " +
                  styles.match_word +
                  " " +
                  get_color(clicked[index])
                }
                data-cy="col1-button"
                onClick={() => click(index)}
              >
                {element.fallbackHints[phrase]?.translation ?? ""}
              </button>
            </div>
          ))}
        </div>
        <div className="match_col">
          {orderA.map((phrase: number, index: number) => (
            <div
              key={index}
              className={styles.test + " " + element.lang_question}
            >
              <button
                key={index}
                className={
                  styles.match_word +
                  " " +
                  get_color(clicked[index + orderB.length]) +
                  " " +
                  element.lang_question
                }
                data-cy="col2-button"
                onClick={() => click(index + orderB.length)}
              >
                {element.fallbackHints[phrase]?.phrase ?? ""}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
