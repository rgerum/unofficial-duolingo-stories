import React from "react";
import styles from "./StoryQuestionMultipleChoice.module.css";

//import useChoiceButtons from "./questions_useChoiceButtons";
//import { EditorHook } from "../editor_hooks";
import StoryLineHints from "../StoryLineHints";
//import { EditorContext, StoryContext } from "../story";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import CheckButton from "../CheckButton";
import { useChoiceButtons } from "@/hooks/use-choice-buttons.hook";

// TODO move
function EditorHook(hidden, editor, editor_props) {
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

function StoryQuestionMultipleChoiceX({ setUnhide, progress, element }) {
  const controls = {}; // React.useContext(StoryContext);
  const editor = null; //React.useContext(EditorContext);

  const [done, setDone] = React.useState(false);
  let active1 = progress === element.trackingProperties.line_index;
  let active = progress === element.trackingProperties.line_index;

  if (element.trackingProperties["challenge_type"] === "multiple-choice") {
    active = progress - 0.5 === element.trackingProperties.line_index;
  }

  React.useEffect(() => {
    if (element.trackingProperties["challenge_type"] === "multiple-choice") {
      if (active1) {
        controls.setProgressStep(0.5);
      }
      if (active) {
        controls.setProgressStep(0.5);
        if (!done) {
          controls.block_next();
        }
      }
    } else {
      if (active && !done) {
        controls.block_next();
      }
    }
  }, [active1, active, done]);

  // whether this part is already shown
  let hidden2 = !active ? styles.hidden : "";

  // get button states and a click function
  let [buttonState, click] = useChoiceButtons(
    element.answers.length,
    element.correctAnswerIndex,
    () => {
      if (editor) return;
      setUnhide(-1);
      setDone(true);
      controls.right();
    },
    controls.wrong,
    active && !done,
  );

  // connect the editor functions
  let onClick;
  [hidden2, onClick] = EditorHook(hidden2, element.editor, editor);

  function get_color(state) {
    if (state === "right") return styles.right;
    if (state === "false") return styles.false;
    if (state === "done") return styles.done;
    return styles.default;
  }
  function get_color_text(state) {
    if (state === "right") return styles.color_base;
    if (state === "false") return styles.color_disabled;
    if (state === "done") return styles.color_disabled;
    return styles.color_base;
  }

  return (
    <div
      className={styles.fadeGlideIn + " " + hidden2 + " " + element.lang}
      onClick={onClick}
      data-lineno={element?.editor?.block_start_no}
      data-cy={!hidden2 ? "multiple-choice" : ""}
    >
      {/* Display the question if a question is there */}
      {element.question ? (
        <StoryQuestionPrompt question={element.question} />
      ) : null}
      {/* Display the answers */}
      <ul className={styles.multiple_choice_ul}>
        {element.answers.map((answer, index) => (
          /* on answer field */
          <li
            key={index}
            className={styles.multiple_choice_li}
            onClick={() => click(index)}
          >
            {/* with a button and a text */}
            <CheckButton type={buttonState[index]} />
            <div
              className={
                styles.multiple_choice_answer_text +
                " " +
                get_color_text(buttonState[index])
              }
            >
              <StoryLineHints content={answer} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StoryQuestionMultipleChoice({ element, active, advance }) {
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

  function get_color_text(state) {
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
              <StoryLineHints content={answer} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StoryQuestionMultipleChoice;
