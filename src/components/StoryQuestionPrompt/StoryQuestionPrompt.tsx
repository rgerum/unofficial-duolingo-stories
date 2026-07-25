import React from "react";

import StoryLineHints from "../StoryLineHints";
import { keepClosingPunctuationWithWord } from "../StoryLineHints/text";
import { ContentWithHints } from "@/components/editor/story/syntax_parser_types";

function StoryQuestionPrompt({
  question,
  lang,
}: {
  question: string | ContentWithHints;
  lang?: string;
}) {
  if (question === undefined) return null;
  if (typeof question === "string")
    return (
      <div className={lang}>{keepClosingPunctuationWithWord(question)}</div>
    );
  return (
    <div className={lang}>
      <StoryLineHints content={question} />
    </div>
  );
}

export default StoryQuestionPrompt;
