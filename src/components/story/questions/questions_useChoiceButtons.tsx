"use no memo";
import React from "react";

export default function useChoiceButtons(
  count,
  rightIndex,
  callRight,
  callWrong,
  active,
) {
  // create a list with one state for each button
  let [buttonState, setButtonState] = React.useState([...new Array(count)]);

  let click = React.useCallback(
    (index) => {
      // when the button was already clicked, do nothing
      if (buttonState[index] !== undefined) return;
      // if the button was the right one
      if (index === rightIndex) {
        // update all button states
        setButtonState((buttonState) =>
          buttonState.map((v, i) =>
            i === index ? "right" : v === "false" ? "false" : "done",
          ),
        );
        // callback for clicking the right button
        callRight();
      } else {
        // set the state of the current button to display that the answer was wrong
        setButtonState((buttonState) =>
          buttonState.map((v, i) => (i === index ? "false" : v)),
        );
        // callback for clicking the wrong button
        callWrong();
      }
    },
    [buttonState, callRight, callWrong],
  );

  let key_event_handler = React.useCallback(
    (e) => {
      let value = parseInt(e.key) - 1;
      if (value < count) click(value);
    },
    [click],
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
