import React from "react";

import StoryLineHints from "../StoryLineHints";
import { ContentWithHints } from "@/components/editor/story/syntax_parser_types";

function StoryQuestionPrompt({
  question,
  lang,
  showTranslationsInline,
}: {
  question: string | ContentWithHints;
  lang?: string;
  showTranslationsInline?: boolean;
}) {
  if (question === undefined) return null;
  if (typeof question === "string")
    return <div className={lang}>{question}</div>;
  return (
    <div className={lang}>
      <StoryLineHints
        content={question}
        showTranslationsInline={showTranslationsInline}
      />
    </div>
  );
}

export default StoryQuestionPrompt;
