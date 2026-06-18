import React from "react";
import { playErrorHaptic, playSuccessHaptic } from "./storyHaptics";
import { playSoundEffect } from "./soundEffects";

export type ChoiceState = "right" | "false" | "done" | undefined;

/**
 * Multiple-choice button state machine ported from the web's
 * use-choice-buttons hook: wrong answers mark themselves red, the right
 * answer locks everything and advances.
 */
export function useChoiceButtons(
  count: number,
  rightIndex: number,
  callRight: () => void,
): [ChoiceState[], (index: number) => void] {
  const [buttonState, setButtonState] = React.useState<ChoiceState[]>(() =>
    new Array(count).fill(undefined),
  );
  const buttonStateRef = React.useRef(buttonState);

  React.useEffect(() => {
    buttonStateRef.current = buttonState;
  }, [buttonState]);

  const click = React.useCallback(
    (index: number) => {
      const state = buttonStateRef.current;
      if (state[index] !== undefined) return;

      if (index === rightIndex) {
        const nextState = state.map((value, i) =>
          i === index ? "right" : value === "false" ? "false" : "done",
        );
        buttonStateRef.current = nextState;
        setButtonState(nextState);
        playSuccessHaptic();
        callRight();
        return;
      }

      playSoundEffect("wrong");
      playErrorHaptic();
      const nextState = state.map((value, i) =>
        i === index ? "false" : value,
      );
      buttonStateRef.current = nextState;
      setButtonState(nextState);
    },
    [callRight, rightIndex],
  );

  return [buttonState, click];
}
