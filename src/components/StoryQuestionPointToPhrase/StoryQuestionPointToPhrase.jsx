import React, { Fragment, useEffect } from "react";
import styles from "./StoryQuestionPointToPhrase.module.css";
//import {EditorContext, StoryContext} from "../story/story";
//import styles_common from "../story/common.module.css";
//import {EditorHook} from "../story/editor_hooks";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import WordButton from "../WordButton";
import { useChoiceButtons } from "../../hooks/use-choice-buttons.hook";

/*
The POINT_TO_PHRASE question
The sentence is first presented to the learner like a normal line, then the learner is asked which word
of the line has a meaning asked for by the question. The right answer is marked with the + sign.

[POINT_TO_PHRASE]
> Choose the option that means "tired."
Speaker560: (Perdón), mi amor, (estoy) (+cansada). ¡(Trabajo) mucho!
~            sorry    my love   I~am     tired       I~work   a~lot

 */

function StoryQuestionPointToPhrase({ element }) {
  //const controls = React.useContext(StoryContext);
  //const editor = React.useContext(EditorContext);

  //const [done, setDone] = React.useState(false);
  //const active1 = progress === element.trackingProperties.line_index;
  //const active2 = progress - 0.5 === element.trackingProperties.line_index;

  //let hidden = !active2 ? styles_common.hidden : "";
  /*
  useEffect(() => {
    if (active1) {
      controls.setProgressStep(0.5);
    }
    if (active2) {
      controls.setProgressStep(0.5);
      if (!done) controls.block_next();
    }
  }, [active1, active2, done]);
*/
  // connect the editor functions
  //let onClick;
  //[hidden, onClick] = EditorHook(hidden, element.editor, editor);

  // find which parts of the text should be converted to buttons
  let button_indices = {};
  for (let [index, part] of Object.entries(element.transcriptParts))
    if (part.selectable)
      button_indices[index] = Object.keys(button_indices).length;

  // get button states and a click function
  let [buttonState, click] = useChoiceButtons(
    element.transcriptParts.length,
    element.correctAnswerIndex,
    () => {
      /*if (!editor) {
        //props.setUnhide(props.element.trackingProperties.line_index);
        controls.right();
        setDone(true);
      }*/
    },
    () => {}, //controls.wrong,
    true, //active2 && !done,
  );
  /*
  function get_color(state) {
    if (state === "right") return styles.right;
    if (state === "false") return styles.false;
    if (state === "done") return styles.done;
    return styles.default;
  }
*/
  return (
    <div>
      {/* display the question */}
      <StoryQuestionPrompt
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
                <WordButton
                  className={
                    styles.word_button + " " /* +
                    get_color(buttonState[button_indices[index]])*/
                  }
                  status={buttonState[button_indices[index]]}
                  data-cy="point-button"
                  onClick={() => click(button_indices[index])}
                >
                  {part.text.replace(/\{.*?}/g, "")}
                </WordButton>
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

export default StoryQuestionPointToPhrase;
