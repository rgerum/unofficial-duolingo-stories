"use client";
import React from "react";
import EnterLine from "./parts/enter_line";
import Card, { CardCheck, CardQuestion, CardTitle } from "./parts/card";

export function ExerciseTranslate({ data, onChecked, active }) {
  const [state, _] = React.useState(0);

  let [text, setText] = React.useState("");

  function Check() {
    let correct = text === data.answers;
    onChecked(correct);
  }

  return (
    <Card state={state} active={active}>
      <CardTitle>Translate</CardTitle>
      <CardQuestion>{data.sentence2.text}</CardQuestion>
      <EnterLine input={text} onChange={setText} />
      <CardCheck onClick={Check}>Check</CardCheck>
    </Card>
  );
}
