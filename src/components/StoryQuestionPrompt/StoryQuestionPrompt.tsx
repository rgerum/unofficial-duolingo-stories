import React from "react";
import styles from "./StoryQuestionPrompt.module.css";

import StoryLineHints from "../StoryLineHints";

function StoryQuestionPrompt({
  question,
  lang,
}: {
  question:
    | string
    | {
        text: string;
        hintMap: {
          rangeFrom: number;
          rangeTo: number;
          hintIndex: number;
        }[];
        hints: string[];
        lang_hints: string;
      };
  lang?: string;
}) {
  if (question === undefined) return null;
  if (typeof question === "string")
    return <div className={styles.question + " " + lang}>{question}</div>;
  return (
    <div className={styles.question + " " + lang}>
      <StoryLineHints content={question} />
    </div>
  );
}

export default StoryQuestionPrompt;
