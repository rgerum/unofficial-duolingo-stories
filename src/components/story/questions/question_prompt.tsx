import styles from "./question_prompt.module.css";

import HintLineContent from "../text_lines/line_hints";
import type { ContentWithHints } from "@/components/editor/story/syntax_parser_types";

interface QuestionPromptProps {
  question: string | ContentWithHints;
  lang?: string;
}

export default function QuestionPrompt({
  question,
  lang,
}: QuestionPromptProps) {
  if (typeof question === "string")
    return (
      <div className={styles.question + " " + (lang ?? "")}>{question}</div>
    );
  return (
    <div className={styles.question + " " + (lang ?? "")}>
      <HintLineContent content={question} />
    </div>
  );
}
