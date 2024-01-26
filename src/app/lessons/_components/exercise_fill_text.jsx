"use client";
import useEnterLine from "./useEnterLine";
import WordBank from "./parts/word_bank";
import GapsLine from "./parts/gaps_line";
import Card, { CardCheck, CardTitle } from "./parts/card";

export function ExerciseFillText({ data, onChecked }) {
  let [params1, params2] = useEnterLine(data.answers);

  function Check() {
    let correct = true;
    for (let i in data.answers) {
      if (params1.words[i] !== data.answers[i]) {
        correct = false;
        break;
      }
    }
    onChecked(correct);
  }

  return (
    <Card>
      <CardTitle>{data.question}</CardTitle>
      <GapsLine sentence={data.sentence} {...params1} />
      <WordBank {...params2} />
      <CardCheck onClick={Check}>Check</CardCheck>
    </Card>
  );
}
