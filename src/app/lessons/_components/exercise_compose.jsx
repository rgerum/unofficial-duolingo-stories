"use client";
import React, { useCallback } from "react";
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
import textCompare from "./textCompare";
import TextCorrected from "./parts/text_corrected";
import Speaker from "./parts/speaker";

export default function ExerciseCompose({ data, onChecked, ...props }) {
  const level = data.level ?? 1;

  const settings = {
    1: {
      distractor_count: 0,
      inverse: false,
      audio_only: false,
      use_word_bank: true,
    },
    2: {
      distractor_count: 3,
      inverse: false,
      audio_only: false,
      use_word_bank: true,
    },
    3: {
      distractor_count: 0,
      inverse: true,
      audio_only: false,
      use_word_bank: true,
    },
    4: {
      distractor_count: 3,
      inverse: true,
      audio_only: false,
      use_word_bank: true,
    },
    5: {
      distractor_count: 0,
      inverse: false,
      audio_only: false,
      use_word_bank: false,
    },
    6: {
      distractor_count: 0,
      inverse: true,
      audio_only: false,
      use_word_bank: false,
    },
  }[level];

  const distractor_count = settings.distractor_count;
  const inverse = settings.inverse;
  const audio_only = false;
  const use_word_bank = settings.use_word_bank;

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
  const [textComp, setTextComp] = React.useState("");
  const words = useShuffle(
    sentenceB.words.concat(sentenceB.distractors.slice(0, distractor_count)),
  );
  //const words = useShuffle(sentenceB.words.concat([]));
  const [params1, params2] = useEnterLine(words);

  const Check = useCallback(() => {
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
      if (text.trim() === "") return;
      let result = textCompare(sentenceB.text, text);
      setTextComp(result);
      correct = result.error_count === 0;
    }
    setState(correct + 1);
  }, [state, onChecked, use_word_bank, params1, text, sentenceB, setTextComp]);

  const key_event_handler = React.useCallback(
    (e) => {
      if (!props.active) return;
      if (e.key === "Enter") {
        Check();
      }
      //let value = parseInt(e.key) - 1;
      //params2.onClick(value);
      //if (value < order.length) click(value);
    },
    [Check, props.active],
  );

  useEventListener("keydown", key_event_handler);

  const type = audio_only ? "Listen" : "Translate";

  if (state === 1) {
    return (
      <Card state={state} {...props}>
        <CardTitle>{type}</CardTitle>
        <CardQuestion audio_only={audio_only}>{sentenceA.text}</CardQuestion>
        {use_word_bank ? (
          <>
            <CardFalse>{params1.map((v) => v.word).join(" ")}</CardFalse>
            <CardCorrect>{sentenceB.text}</CardCorrect>
          </>
        ) : (
          <>
            <CardFalse>
              <TextCorrected parts={textComp.correted1} />{" "}
            </CardFalse>
            <CardCorrect>
              <TextCorrected parts={textComp.correted2} />{" "}
            </CardCorrect>
          </>
        )}

        <CardCheck onClick={Check}>{state ? "Next" : "Check"}</CardCheck>
      </Card>
    );
  }

  if (state === 2) {
    return (
      <Card state={state} {...props}>
        <CardTitle>{type}</CardTitle>
        <CardQuestion audio_only={audio_only}>{sentenceA.text}</CardQuestion>
        <EnterLine text={sentenceB.text} />
        {use_word_bank ? <WordBank words={params2} /> : null}
        <CardCheck onClick={Check}>{state ? "Next" : "Check"}</CardCheck>
      </Card>
    );
  }

  return (
    <Card state={state} {...props}>
      <CardTitle>{type}</CardTitle>
      <CardQuestion audio_only={audio_only}>
        {!inverse ? <Speaker /> : null}
        {sentenceA.text}
      </CardQuestion>
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
