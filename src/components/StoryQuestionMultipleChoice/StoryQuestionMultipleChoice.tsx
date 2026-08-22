import React from "react";

//import useChoiceButtons from "./questions_useChoiceButtons";
//import { EditorHook } from "../editor_hooks";
import StoryLineHints from "../StoryLineHints";
//import { EditorContext, StoryContext } from "../story";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import CheckButton from "../CheckButton";
import { useChoiceButtons } from "@/hooks/use-choice-buttons.hook";
import { StoryElementMultipleChoice } from "@/components/editor/story/syntax_parser_types";
import type { ChoiceButtonState } from "@/lib/story/choice_button_state";
import { cn } from "@/lib/utils";

export type SingleAnswerControl = {
  state: ChoiceButtonState;
  select: () => void;
};

/*
The MULTIPLE_CHOICE question.
The learner has to find the right answer from different answers which have a checkbox.

[MULTIPLE_CHOICE]
> Priti was so tired that…
- …she fell asleep in the kitchen.
+ …she put salt in her coffee.
- …she put her keys in her coffee.

The CONTINUATION question
It also uses the multiple choice component. The learner has to find out how to continue the sentence. Similar to the
SELECT_PHRASE question, but here the learner does not hear the hidden part of the sentence.
 */

function StoryQuestionMultipleChoice({
  element,
  active,
  advance,
  showTranslationsInline,
  compact = false,
  singleAnswerControl,
}: {
  element: StoryElementMultipleChoice;
  active: boolean;
  advance: () => void;
  showTranslationsInline?: boolean;
  compact?: boolean;
  singleAnswerControl?: SingleAnswerControl;
}) {
  //const [done, setDone] = React.useState(false);

  // get button states and a click function
  const [buttonState, click] = useChoiceButtons(
    element.answers.length,
    element.correctAnswerIndex,
    () => {
      advance();
      //setDone(true);
    },
    () => {},
    active,
  );

  function getColorText(state: ChoiceButtonState) {
    return cn(
      "flex items-center",
      compact ? "my-1.5 gap-2" : "my-5 gap-[18px]",
      (state === "false" || state === "done") &&
        "text-[var(--color_disabled_color)]",
    );
  }

  return (
    <div className={element.lang}>
      {/* Display the question if a question is there */}
      {element.question && (
        <StoryQuestionPrompt
          question={element.question}
          showTranslationsInline={showTranslationsInline}
        />
      )}
      {/* Display the answers */}
      <ul className="list-none p-0 text-[var(--text-color)]">
        {element.answers.map((answer, index) => (
          /* on answer field */
          <li
            key={index}
            className={getColorText(
              singleAnswerControl?.state ?? buttonState[index],
            )}
            onClick={() =>
              singleAnswerControl ? singleAnswerControl.select() : click(index)
            }
          >
            {/* with a button and a text */}
            <CheckButton
              type={singleAnswerControl?.state ?? buttonState[index]}
              compact={compact}
            />
            <div>
              {typeof answer == "string" ? (
                answer
              ) : (
                <StoryLineHints
                  content={answer}
                  showTranslationsInline={showTranslationsInline}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StoryQuestionMultipleChoice;
