import React, { useState } from "react";

function useHideList(words, right_answer) {
  let [status, setStatus] = useState(
    [...Array(words.length)].map(() => "idle"),
  );
  let [selected, setSelected] = useState(undefined);

  const check_done = React.useCallback(
    (index, new_status) => {
      for (let i = 0; i < status.length; i++) {
        if ((i === index ? new_status : status[i]) !== "correct") return false;
      }
      return true;
    },
    [status],
  );

  const doSetStatus = React.useCallback(
    (i, new_status) => {
      setStatus(status.map((v, index) => (index === i ? new_status : v)));
      if (new_status === "wrong") {
        setTimeout(() => {
          doSetStatus(i, "idle");
        }, 1500);
      }
    },
    [setStatus, status],
  );

  const select = React.useCallback(
    (i) => {
      // clicking again unselects
      if (selected === -1) {
        return;
      }
      setSelected(i);
      return true;
    },
    [setSelected, doSetStatus, selected, status, check_done],
  );

  const set_selected_status = React.useCallback(
    (new_status) => {
      doSetStatus(selected, new_status);
      setSelected(undefined);
    },
    [setSelected, doSetStatus, selected],
  );

  const check = React.useCallback(() => {
    if (selected === undefined) return;
    const right = words[selected] === right_answer;
    if (right) {
      set_selected_status("correct-stay");
    } else {
      set_selected_status("wrong-stay");
    }
    setSelected(-1);
    return right;
  }, [selected]);
  const all_words = [];
  for (let i = 0; i < words.length; i++) {
    all_words.push({
      word: words[i],
      status: selected === i ? "selected" : status[i],
    });
  }
  return [all_words, select, check];
}

export default function useChoiceButtons(words, right_answer) {
  let [params1, select, check] = useHideList(words, right_answer);

  let click1 = React.useCallback(
    (index) => {
      select(index);
    },
    [params1, select],
  );

  for (let i = 0; i < params1.length; i++) {
    params1[i].onClick = () => click1(i);
  }
  return [params1, check];
}
