"use client";
import React, { useState } from "react";
import WordColumn, { WordColumnGroup } from "./parts/word_column";
import Card, { CardCheck, CardTitle } from "./parts/card";
import useShuffle from "./useShuffle";
import * as PropTypes from "prop-types";

WordColumn.propTypes = { words: PropTypes.any };
export default function ExerciseMatch({ data, onChecked, ...props }) {
  const [state, setState] = React.useState(0);
  const shuffleA = useShuffle(data.pairs);
  const shuffleB = useShuffle(data.pairs);

  function Check() {
    if (state !== 0) return onChecked(state - 1);
    if (!params1.words.length) return;
    let correct = true;
    for (let i in sentenceB.words) {
      if (params1.words[i] !== sentenceB.words[i]) {
        correct = false;
        break;
      }
    }
    setState(correct + 1);
  }

  const [words_a, words_b] = useWordMatch(shuffleA, shuffleB, () => {
    setState(2);
  });

  return (
    <Card state={state} {...props}>
      <CardTitle>Tap the pairs</CardTitle>
      <WordColumnGroup>
        <WordColumn words={words_a} />
        <WordColumn words={words_b} />
      </WordColumnGroup>
      <CardCheck onClick={Check}>{state ? "Next" : "Check"}</CardCheck>
    </Card>
  );
}

function useHideList(words, right_match) {
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
    (i, partner) => {
      // clicking again unselects
      if (selected === i) {
        setSelected(undefined);
        return ["selected", false];
      }
      // finished words cannot be selected
      if (status[i] !== "idle") return ["selected", false];
      // if the other column has a match check if it matches
      if (partner) {
        let new_state = right_match[i] === partner ? "correct" : "wrong";
        doSetStatus(i, new_state);
        return [new_state, check_done(i, new_state)];
      }
      setSelected(i);
      return ["selected", false];
    },
    [setSelected, doSetStatus, selected, status, right_match, check_done],
  );

  const get_selected = React.useCallback(() => {
    if (selected === undefined) return undefined;
    return words[selected];
  }, [words, selected]);

  const set_selected_status = React.useCallback(
    (new_status) => {
      doSetStatus(selected, new_status);
      setSelected(undefined);
    },
    [setSelected, doSetStatus, selected],
  );

  const all_words = [];
  for (let i = 0; i < words.length; i++) {
    all_words.push({
      word: words[i],
      status: selected === i ? "selected" : status[i],
    });
  }
  return [all_words, select, get_selected, set_selected_status];
}

function useWordMatch(pairs, pairs2, onDone) {
  const [params1, select1, get_selected1, set_selected_status1] = useHideList(
    pairs.map((item) => item.left),
    pairs.map((item) => item.right),
  );
  const [params2, select2, get_selected2, set_selected_status2] = useHideList(
    pairs2.map((item) => item.right),
    pairs2.map((item) => item.left),
  );

  const click1 = React.useCallback(
    (index) => {
      const [new_status, done] = select1(index, get_selected2());
      if (new_status !== "selected") {
        set_selected_status2(new_status);
      }
      if (done) onDone();
    },
    [select1, get_selected2, set_selected_status2, onDone],
  );
  const click2 = React.useCallback(
    (index) => {
      const [new_status, done] = select2(index, get_selected1());
      if (new_status !== "selected") {
        set_selected_status1(new_status);
      }
      if (done) onDone();
    },
    [select2, get_selected1, set_selected_status1, onDone],
  );

  for (let i = 0; i < params1.length; i++) {
    params1[i].onClick = () => click1(i);
    params2[i].onClick = () => click2(i);
  }
  return [params1, params2];
}
