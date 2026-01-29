import React, { useEffect } from "react";
import styles from "./question_arrange.module.css";
import styles_common from "../common.module.css";

import { EditorHook } from "../editor_hooks";
import { EditorContext, StoryContext } from "../story";
import type { StoryElementArrange } from "@/components/editor/story/syntax_parser_types";

/*
The ARRANGE question
It consists of buttons that the learner needs to click in the right order.

[ARRANGE]
> Tap what you hear
Speaker560: ¡[(Necesito) (las~llaves) (de) (mi) (carro)!]
~              I~need     the~keys     of   my   car
 */

// Button states: undefined = default, 1 = off/correct, 2 = wrong
type ArrangeButtonState = number | undefined;

interface QuestionArrangeProps {
  setUnhide: (position: number) => void;
  progress: number;
  element: StoryElementArrange;
}

export default function QuestionArrange({
  setUnhide,
  progress,
  element,
}: QuestionArrangeProps) {
  const controls = React.useContext(StoryContext);
  const editor = React.useContext(EditorContext);

  const [done, setDone] = React.useState(false);
  const active = progress === element.trackingProperties.line_index;

  useEffect(() => {
    if (active && !done) {
      controls?.block_next();
    }
  }, [active, done, controls]);

  let hidden2 = !active ? styles_common.hidden : "";

  let onClick: (() => void) | undefined;
  [hidden2, onClick] = EditorHook(hidden2, element.editor, editor);

  const [buttonState, click] = useArrangeButtons(
    element.phraseOrder,
    () => controls?.right(),
    () => controls?.wrong(),
    (i: number) => {
      setDone(true);
      if (!editor && element.characterPositions)
        setUnhide(element.characterPositions[i]);
    },
    active,
  );

  return (
    <div
      style={{ textAlign: "center" }}
      className={styles_common.fadeGlideIn + " " + hidden2 + " " + element.lang}
      onClick={onClick}
      data-lineno={element?.editor?.block_start_no}
    >
      <div>
        {element.selectablePhrases.map((phrase: string, index: number) => (
          <span
            key={index}
            className={styles.word_order}
            data-cy="arrange-button"
            data-index={element.phraseOrder[index]}
            data-status={[undefined, "off", "wrong"][buttonState[index] ?? 0]}
            onClick={() => click(index)}
          >
            {phrase}
          </span>
        ))}
      </div>
    </div>
  );
}

function useArrangeButtons(
  order: number[],
  callRight: () => void,
  callWrong: () => void,
  callAdvance: (position: number) => void,
  active: boolean,
): [ArrangeButtonState[], (index: number) => void] {
  const [buttonState, setButtonState] = React.useState<ArrangeButtonState[]>(
    () => new Array(order.length).fill(undefined),
  );
  const [position, setPosition] = React.useState(0);

  const click = React.useCallback(
    (index: number) => {
      if (buttonState[index] === 1) return;

      if (position === order[index]) {
        if (position === order.length - 1) callRight();
        callAdvance(position);
        setButtonState((prev) => prev.map((v, i) => (i === index ? 1 : v)));
        setPosition(position + 1);
      } else {
        setTimeout(() => {
          setButtonState((prev) =>
            prev.map((v, i) => (i === index && v === 2 ? 0 : v)),
          );
        }, 820);
        setButtonState((prev) => prev.map((v, i) => (i === index ? 2 : v)));
        callWrong();
      }
    },
    [buttonState, position, order, callRight, callWrong, callAdvance],
  );

  const key_event_handler = React.useCallback(
    (e: KeyboardEvent) => {
      const value = parseInt(e.key) - 1;
      if (value < order.length) click(value);
    },
    [click, order.length],
  );

  React.useEffect(() => {
    if (active) {
      window.addEventListener("keypress", key_event_handler);
      return () => window.removeEventListener("keypress", key_event_handler);
    }
  }, [key_event_handler, active]);

  return [buttonState, click];
}
