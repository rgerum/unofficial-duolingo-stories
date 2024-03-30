import React from "react";
import styles from "./StoryChallengeContinuation.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionSelectPhrase from "../StoryQuestionSelectPhrase";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";

function StoryChallengeContinuation({ parts, setDone }) {
  let [unhide, setUnhide] = React.useState(0);

  function advance(i, done) {
    setUnhide(-1);
    if (setDone) setDone();
  }

  return (
    <>
      <StoryQuestionPrompt question={parts[0].prompt} />
      <StoryTextLine element={parts[1]} unhide={unhide} />
      <StoryQuestionMultipleChoice element={parts[2]} advance={advance} />
    </>
  );
}

export default StoryChallengeContinuation;
