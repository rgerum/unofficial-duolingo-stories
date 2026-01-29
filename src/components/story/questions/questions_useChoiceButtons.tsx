"use no memo";
import React from "react";
import type { ButtonState } from "../types";

export default function useChoiceButtons(
  count: number,
  rightIndex: number,
  callRight: () => void,
  callWrong: () => void,
  active: boolean,
): [ButtonState[], (index: number) => void] {
  // create a list with one state for each button
  const [buttonState, setButtonState] = React.useState<ButtonState[]>(() =>
    new Array(count).fill(undefined),
  );

  const click = React.useCallback(
    (index: number) => {
      // when the button was already clicked, do nothing
      if (buttonState[index] !== undefined) return;
      // if the button was the right one
      if (index === rightIndex) {
        // update all button states
        setButtonState((prev) =>
          prev.map((v, i) =>
            i === index ? "right" : v === "false" ? "false" : "done",
          ),
        );
        // callback for clicking the right button
        callRight();
      } else {
        // set the state of the current button to display that the answer was wrong
        setButtonState((prev) =>
          prev.map((v, i) => (i === index ? "false" : v)),
        );
        // callback for clicking the wrong button
        callWrong();
      }
    },
    [buttonState, rightIndex, callRight, callWrong],
  );

  const key_event_handler = React.useCallback(
    (e: KeyboardEvent) => {
      const value = parseInt(e.key) - 1;
      if (value < count) click(value);
    },
    [click, count],
  );

  React.useEffect(() => {
    if (active) {
      window.addEventListener("keypress", key_event_handler);
      return () => window.removeEventListener("keypress", key_event_handler);
    }
  }, [key_event_handler, active]);

  // return button states and click callback
  return [buttonState, click];
}
