import React from "react";
import useKeypress from "./use-keypress.hook";
import { playSoundEffect } from "@/lib/sound-effects";
import {
  createChoiceButtonStates,
  selectChoiceButton,
} from "@/lib/story/choice_button_state";

export function useChoiceButtons(
  count: number,
  rightIndex: number,
  callRight: () => void,
  callWrong: () => void,
  active: boolean,
) {
  // create a list with one state for each button
  const [buttonState, setButtonState] = React.useState(() =>
    createChoiceButtonStates(count),
  );

  const click = React.useCallback(
    (index: number) => {
      // when the button was already clicked, do nothing
      if (buttonState[index] !== undefined) return;
      // if the button was the right one
      if (index === rightIndex) {
        // update all button states
        setButtonState((buttonState) =>
          selectChoiceButton(buttonState, rightIndex, index),
        );
        // callback for clicking the right button
        callRight();
      } else {
        // set the state of the current button to display that the answer was wrong
        setButtonState((buttonState) =>
          selectChoiceButton(buttonState, rightIndex, index),
        );
        // callback for clicking the wrong button
        playSoundEffect("wrong");
        callWrong();
      }
    },
    [buttonState, callRight, callWrong, rightIndex],
  );

  useKeypress("number", (value: KeyboardEvent | number) => {
    if (typeof value === "number" && active && value <= count) click(value - 1);
  });

  // return button states and click callback
  return [buttonState, click] as const;
}
