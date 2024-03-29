import React from "react";
import styles from "./StoryQuestionSelectPhrase.module.css";

import useChoiceButtons from "../story/questions/questions_useChoiceButtons";
import WordButton from "../WordButton";

/*
The SELECT_PHRASE question.
The learner has to listen what is spoken and find the right answer. The answers are buttons and do not contain
translations as the focus (in contrast to CONTINUATION) is on listening and not on content.

[SELECT_PHRASE]
> Select the missing phrase
Speaker507: Hoy   tengo  [un~partido~importante].
~           today I~have  an~important~game
+ un partido importante
- un batido importante
- una parte imponente
 */

function StoryQuestionSelectPhrase({ element }) {
  // get button states and a click function
  let [buttonState, click] = useChoiceButtons(
    element.answers.length,
    element.correctAnswerIndex,
    () => {
      /*if (!editor) {
          if (setUnhide) setUnhide(-1);
          setDone(true);
          if (controls?.right) controls?.right();
        }*/
    },
    () => {}, //controls?.wrong || (() => {}),
    true, //active && !done,
  );

  function getState(index) {
    const status = buttonState[index];
    if (status === "right") return "right-stay";
    return status;
  }
  return (
    <div>
      <div className={styles.group}>
        {/* display the buttons */}
        {element.answers.map((answer, index) => (
          /* one answer button */
          <WordButton
            key={index}
            status={getState(index)}
            data-cy="select-button"
            onClick={() => click(index)}
          >
            {answer.text
              ? answer.text.replace(/\{.*?}/g, "")
              : answer.replace(/\{.*?}/g, "")}
          </WordButton>
        ))}
      </div>
    </div>
  );
}

export default StoryQuestionSelectPhrase;
