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
      setButtonState((state) => {
        if (state[index] !== undefined) return state;
        if (index === rightIndex) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          callRight();
          return state.map((value, i) =>
            i === index ? "right" : value === "false" ? "false" : "done",
          );
        }
        playSoundEffect("wrong");
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return state.map((value, i) => (i === index ? "false" : value));
      });
    },
    [callRight, rightIndex],
  );

  return [buttonState, click];
}
