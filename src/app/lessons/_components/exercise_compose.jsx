"use client";
import React from "react";
import useEnterLine from "./useEnterLine";
import EnterLine from "./parts/enter_line";
import WordBank from "./parts/word_bank";
import Card, {
  CardCheck,
  CardCorrect,
  CardFalse,
  CardQuestion,
  CardTitle,
} from "./parts/card";
import useShuffle from "./useShuffle";
import { useEventListener } from "./useEventListener";

export function ExerciseCompose({ data, onChecked, active }) {
  const distractor_count = 2;
  const inverse = false;
  const audio_only = false;
  const use_word_bank = false;

  const sentenceA = audio_only
    ? data.sentence1
    : inverse
      ? data.sentence2
      : data.sentence1;
  const sentenceB = audio_only
    ? data.sentence1
    : inverse
      ? data.sentence1
      : data.sentence2;
  const [state, setState] = React.useState(0);
  const [text, setText] = React.useState("");
  const words = useShuffle(
    sentenceB.words.concat(sentenceB.distractors.slice(0, distractor_count)),
  );
  //const words = useShuffle(sentenceB.words.concat([]));
  const [params1, params2] = useEnterLine(words);

  function Check() {
    console.log(state);
    if (state !== 0) return onChecked(state - 1);
    let correct = true;
    if (use_word_bank) {
      if (!params1.length) return;

      for (let i in sentenceB.words) {
        if (params1[i].word !== sentenceB.words[i]) {
          correct = false;
          break;
        }
      }
    } else {
      console.log("compare", text, sentenceB.text);
      correct = text.trim() === sentenceB.text.trim();
    }
    console.log("set", correct + 1);
    setState(correct + 1);
  }

  let key_event_handler = React.useCallback(
    (e) => {
      if (!active) return;
      if (e.key === "Enter") {
        Check();
      }
      let value = parseInt(e.key) - 1;
      params2.onClick(value);
      //if (value < order.length) click(value);
    },
    [Check, active],
  );

  useEventListener("keydown", key_event_handler);

  const type = audio_only ? "Listen" : "Translate";

  if (state === 1) {
    return (
      <Card state={state} active={active}>
        <CardTitle>{type}</CardTitle>
        <CardQuestion audio_only={audio_only}>{sentenceA.text}</CardQuestion>
        {use_word_bank ? (
          <CardFalse>{params1.map((v) => v.word).join(" ")}</CardFalse>
        ) : (
          <CardFalse>{text}</CardFalse>
        )}
        <CardCorrect>{sentenceB.text}</CardCorrect>
        <CardCheck onClick={Check}>{state ? "Next" : "Check"}</CardCheck>
      </Card>
    );
  }

  if (state === 2) {
    return (
      <Card state={state} active={active}>
        <CardTitle>{type}</CardTitle>
        <CardQuestion audio_only={audio_only}>{sentenceA.text}</CardQuestion>
        <EnterLine text={sentenceB.text} />
        {use_word_bank ? <WordBank words={params2} /> : null}
        <CardCheck onClick={Check}>{state ? "Next" : "Check"}</CardCheck>
      </Card>
    );
  }

  return (
    <Card state={state} active={active}>
      <CardTitle>{type}</CardTitle>
      <CardQuestion audio_only={audio_only}>{sentenceA.text}</CardQuestion>
      {use_word_bank ? (
        <>
          <EnterLine words={params1} />
          <WordBank words={params2} />
        </>
      ) : (
        <EnterLine input={text} onChange={setText} />
      )}
      <CardCheck onClick={Check}>{state ? "Next" : "Check"}</CardCheck>
    </Card>
  );
}
