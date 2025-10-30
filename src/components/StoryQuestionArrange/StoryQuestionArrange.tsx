import React from "react";
import styles from "./StoryQuestionArrange.module.css";
import WordButton from "../WordButton";

/*
The ARRANGE question
It consists of buttons that the learner needs to click in the right order.

[ARRANGE]
> Tap what you hear
Speaker560: ¡[(Necesito) (las~llaves) (de) (mi) (carro)!]
~              I~need     the~keys     of   my   car
 */

function StoryQuestionArrange({
  element,
  active,
  advance,
}: {
  element: {
    selectablePhrases: string[];
    phraseOrder: number[];
    characterPositions: number[];
  };
  active: boolean;
  advance: (i: number, done: boolean) => void;
}) {
  const [done, setDone] = React.useState(false);

  let [buttonState, click] = useArrangeButtons(
    element.phraseOrder,
    () => {}, //controls.right,
    () => {}, //controls.wrong,
    (i) => {
      setDone(true);
      //if (!editor)
      advance(
        element.characterPositions[i],
        i === element.phraseOrder.length - 1,
      );
    },
    active, //active,
  );

  return (
    <div style={{ textAlign: "center" }}>
      <div>
        {element.selectablePhrases.map((phrase, index) => (
          <WordButton
            key={index}
            data-cy="arrange-button"
            data-index={element.phraseOrder[index]}
            status={[undefined, "off", "wrong"][buttonState[index]]}
            onClick={() => click(index)}
          >
            {phrase}
          </WordButton>
        ))}
      </div>
    </div>
  );
}

function useArrangeButtons(
  order: number[],
  callRight: () => void,
  callWrong: () => void,
  callAdvance: (i: number) => void,
  active: boolean,
) {
  let [buttonState, setButtonState] = React.useState([
    ...new Array(order.length),
  ]);
  let [position, setPosition] = React.useState(0);

  let click = React.useCallback(
    (index: number) => {
      if (buttonState[index] === 1) return;

      if (position === order[index]) {
        if (position === order.length - 1) callRight();
        callAdvance(position);
        setButtonState((buttonState) =>
          buttonState.map((v, i) => (i === index ? 1 : v)),
        );
        setPosition(position + 1);
      } else {
        setTimeout(() => {
          setButtonState((buttonState) =>
            buttonState.map((v, i) => (i === index && v === 2 ? 0 : v)),
          );
        }, 820);
        setButtonState((buttonState) =>
          buttonState.map((v, i) => (i === index ? 2 : v)),
        );
        callWrong();
      }
    },
    [buttonState, position, order, callRight, callWrong],
  );

  let key_event_handler = React.useCallback(
    (e: KeyboardEvent) => {
      let value = parseInt(e.key) - 1;
      if (value < order.length) click(value);
    },
    [click],
  );
  React.useEffect(() => {
    if (active) {
      window.addEventListener("keypress", key_event_handler);
      return () => window.removeEventListener("keypress", key_event_handler);
    }
  }, [key_event_handler, active]);

  return [buttonState, click] as const;
}

export default StoryQuestionArrange;
