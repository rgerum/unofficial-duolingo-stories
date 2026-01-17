import React, { Fragment, useEffect } from "react";
import styles from "./question_point_to_phrase.module.css";
import styles_common from "../common.module.css";

import { EditorHook } from "../editor_hooks";
import useChoiceButtons from "./questions_useChoiceButtons";
import { EditorContext, StoryContext } from "../story";
import QuestionPrompt from "./question_prompt";
import type { StoryElementPointToPhrase } from "@/components/editor/story/syntax_parser_types";
import type { ButtonState } from "../types";

/*
The POINT_TO_PHRASE question
The sentence is first presented to the learner like a normal line, then the learner is asked which word
of the line has a meaning asked for by the question. The right answer is marked with the + sign.

[POINT_TO_PHRASE]
> Choose the option that means "tired."
Speaker560: (Perdón), mi amor, (estoy) (+cansada). ¡(Trabajo) mucho!
~            sorry    my love   I~am     tired       I~work   a~lot

 */

interface QuestionPointToPhraseProps {
  progress: number;
  element: StoryElementPointToPhrase;
}

export default function QuestionPointToPhrase({ progress, element }: QuestionPointToPhraseProps) {
  const controls = React.useContext(StoryContext);
  const editor = React.useContext(EditorContext);

  const [done, setDone] = React.useState(false);
  const active1 = progress === element.trackingProperties.line_index;
  const active2 = progress - 0.5 === element.trackingProperties.line_index;

  let hidden = !active2 ? styles_common.hidden : "";

  useEffect(() => {
    if (active1) {
      controls?.setProgressStep(0.5);
    }
    if (active2) {
      controls?.setProgressStep(0.5);
      if (!done) controls?.block_next();
    }
  }, [active1, active2, done, controls]);

  // connect the editor functions
  let onClick: (() => void) | undefined;
  [hidden, onClick] = EditorHook(hidden, element.editor, editor);

  // find which parts of the text should be converted to buttons
  const button_indices: Record<number, number> = {};
  for (const [index, part] of element.transcriptParts.entries()) {
    if (part.selectable) {
      button_indices[index] = Object.keys(button_indices).length;
    }
  }

  // get button states and a click function
  const [buttonState, click] = useChoiceButtons(
    element.transcriptParts.filter((p) => p.selectable).length,
    element.correctAnswerIndex,
    () => {
      if (!editor) {
        controls?.right();
        setDone(true);
      }
    },
    () => controls?.wrong(),
    active2 && !done,
  );

  function get_color(state: ButtonState): string {
    if (state === "right") return styles.right;
    if (state === "false") return styles.false;
    if (state === "done") return styles.done;
    return styles.default;
  }

  return (
    <div
      className={hidden}
      onClick={onClick}
      data-lineno={element?.editor?.block_start_no}
    >
      {/* display the question */}
      <QuestionPrompt
        question={element.question}
        lang={element.lang_question}
      />
      {/* display the text */}
      <div className={element.lang}>
        {element.transcriptParts.map((part, index) => (
          <Fragment key={index}>
            {
              /* is the text selectable? */
              part.selectable ? (
                /* then display a button */
                <div
                  className={
                    styles.word_button +
                    " " +
                    get_color(buttonState[button_indices[index]])
                  }
                  data-cy="point-button"
                  onClick={() => click(button_indices[index])}
                >
                  {part.text.replace(/\{.*?}/g, "")}
                </div>
              ) : (
                /* if it is not selectable just display the text */
                <span>{part.text}</span>
              )
            }
            {part.text.indexOf("\n") !== -1 ? <br /> : <></>}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
