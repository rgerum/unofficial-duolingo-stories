import React from "react";
import styles from "./StoryQuestionMultipleChoice.module.css";

//import useChoiceButtons from "./questions_useChoiceButtons";
//import { EditorHook } from "../editor_hooks";
import StoryLineHints from "../StoryLineHints";
//import { EditorContext, StoryContext } from "../story";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import CheckButton from "../CheckButton";
import { useChoiceButtons } from "@/hooks/use-choice-buttons.hook";
import { StoryElementMultipleChoice } from "@/components/editor/story/syntax_parser_types";
import { EditorView } from "codemirror";

// TODO move
function EditorHook(
  hidden: string,
  editor: {
    block_start_no?: number;
    start_no: number;
    end_no: number;
    active_no?: number;
  },
  editor_props: {
    select: (lineno: number) => void;
    block_next: () => void;
    right: () => void;
    wrong: () => void;
    view: EditorView;
    start_no: number;
    end_no: number;
    setProgressStep: (step: number) => void;
  },
) {
  let onClick;
  let view = editor_props?.view;

  if (editor_props) {
    hidden = "";
  }

  if (editor && view) {
    onClick = () => {
      if (editor.active_no) editor_props.select(editor.active_no);
      else editor_props.select(editor.start_no);
    };
  }

  let [selected, setSelected] = React.useState(false);
  if (selected) hidden = "story_selection";
  /*useEventListener("editorLineChanged", (e) =>
    {
        let should_be_selected = editor && editor.start_no <= e.detail.lineno && e.detail.lineno < editor.end_no;
        if (should_be_selected !== selected)
            setSelected(should_be_selected);
    })*/ //TODO
  return [hidden, onClick];
}

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
}: {
  element: StoryElementMultipleChoice;
  active: boolean;
  advance: () => void;
}) {
  //const [done, setDone] = React.useState(false);

  // get button states and a click function
  let [buttonState, click] = useChoiceButtons(
    element.answers.length,
    element.correctAnswerIndex,
    () => {
      advance();
      //setDone(true);
    },
    () => {},
    active,
  );

  function get_color_text(state: string) {
    if (state === "false" || state === "done")
      return `${styles.multiple_choice_li} ${styles.disabled}`;
    return styles.multiple_choice_li;
  }

  return (
    <div className={element.lang}>
      {/* Display the question if a question is there */}
      {element.question && <StoryQuestionPrompt question={element.question} />}
      {/* Display the answers */}
      <ul className={styles.multiple_choice_ul}>
        {element.answers.map((answer, index) => (
          /* on answer field */
          <li
            key={index}
            className={get_color_text(buttonState[index])}
            onClick={() => click(index)}
          >
            {/* with a button and a text */}
            <CheckButton type={buttonState[index]} />
            <div>
              {typeof answer == "string" ? (
                answer
              ) : (
                <StoryLineHints content={answer} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StoryQuestionMultipleChoice;
