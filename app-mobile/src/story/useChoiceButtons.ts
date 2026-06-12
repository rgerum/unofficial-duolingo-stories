import React from "react";
import * as Haptics from "expo-haptics";
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

  const click = React.useCallback(
    (index: number) => {
      if (buttonState[index] !== undefined) return;
      if (index === rightIndex) {
        setButtonState((state) =>
          state.map((value, i) =>
            i === index ? "right" : value === "false" ? "false" : "done",
          ),
        );
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        callRight();
      } else {
        setButtonState((state) =>
          state.map((value, i) => (i === index ? "false" : value)),
        );
        playSoundEffect("wrong");
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [buttonState, callRight, rightIndex],
  );

  return [buttonState, click];
}
