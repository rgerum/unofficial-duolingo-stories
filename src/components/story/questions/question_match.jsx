import React, { useEffect, useState } from "react";
import styles from "./question_match.module.css";
import styles_common from "../common.module.css";

import { shuffle } from "../includes";
import { EditorHook } from "../editor_hooks";
import { EditorContext, StoryContext } from "../story";
import QuestionPrompt from "./question_prompt";

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

export default function QuestionMatch({ progress, element }) {
  const controls = React.useContext(StoryContext);
  const editor = React.useContext(EditorContext);

  const [done, setDone] = React.useState(false);
  const active = progress === element.trackingProperties.line_index;

  useEffect(() => {
    if (active && !done && controls?.block_next) {
      controls.block_next();
    }
  }, [active, done]);

  // whether this part is already shown
  let hidden2 = !active ? styles_common.hidden : "";

  let [orderA, setOrderA] = useState([]);
  let [orderB, setOrderB] = useState([]);
  let [clicked, setClicked] = useState(undefined);
  let [last_clicked, setLastClicked] = useState(undefined);

  let order = orderB.concat(orderA);

  // when order is not initialized or when the number of elements changed in the editor
  if (orderA === undefined || orderA.length !== element.fallbackHints.length) {
    let clicked = [];
    let orderA = [];
    let orderB = [];
    for (let i in element.fallbackHints) {
      orderA.push(parseInt(i));
      orderB.push(parseInt(i));
      clicked.push(undefined);
      clicked.push(undefined);
    }
    shuffle(orderA);
    shuffle(orderB);
    setOrderA(orderA);
    setOrderB(orderB);
    setClicked(clicked);
    setLastClicked(undefined);
  }

  let click = React.useCallback(
    (index) => {
      index = parseInt(index);
      // do not allow to click on finished words again
      if (clicked[index] === "right") return;
      // select the word
      if (
        last_clicked === undefined ||
        index >= orderB.length === last_clicked >= orderB.length
      ) {
        clicked[index] = "selected";
        if (last_clicked !== undefined) clicked[last_clicked] = undefined;
        setLastClicked(index);
        setClicked(clicked);
      }
      // deselect the word
      else if (last_clicked === index) {
        setLastClicked(undefined);
        clicked[index] = undefined;
        setClicked(clicked);
      }
      // the pair is right
      else if (order[last_clicked] === order[index]) {
        clicked[index] = "right";
        clicked[last_clicked] = "right";
        setLastClicked(undefined);
        setClicked(clicked);
        let right_count = clicked
          .map((item) => item === "right")
          .reduce((a, b) => a + b, 0);
        if (right_count >= clicked.length) {
          setDone(true);
          if (controls?.right) controls.right();
        }
      }
      // the pair is wrong
      else if (order[last_clicked] !== order[index]) {
        let last_clicked_old = last_clicked;
        clicked[index] = "wrong";
        clicked[last_clicked_old] = "wrong";
        setLastClicked(undefined);
        setClicked(clicked);
        setTimeout(() => {
          if (clicked[index] === "wrong") clicked[index] = undefined;
          if (clicked[last_clicked_old] === "wrong")
            clicked[last_clicked_old] = undefined;
          setClicked(clicked);
        }, 1500);
      }
    },
    [clicked, last_clicked, orderB, setLastClicked, setClicked, setDone],
  );

  let key_event_handler = React.useCallback(
    (e) => {
      let value = parseInt(e.key) - 1;
      if (value === -1) value = 9;
      if (value < orderA.length + orderB.length) click(value);
    },
    [click],
  );
  React.useEffect(() => {
    if (active) {
      window.addEventListener("keypress", key_event_handler);
      return () => window.removeEventListener("keypress", key_event_handler);
    }
  }, [key_event_handler, active]);

  let onClick;
  [hidden2, onClick] = EditorHook(hidden2, element.editor, editor);

  function get_color(state) {
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
          {orderB.map((phrase, index) => (
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
                {element.fallbackHints[phrase]
                  ? element.fallbackHints[phrase][["phrase", "translation"][1]]
                  : ""}
              </button>
            </div>
          ))}
        </div>
        <div className="match_col">
          {orderA.map((phrase, index) => (
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
                {element.fallbackHints[phrase]
                  ? element.fallbackHints[phrase][["phrase", "translation"][0]]
                  : ""}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
