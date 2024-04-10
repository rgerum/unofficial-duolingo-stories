import React from "react";
import styles from "./StoryChallengeContinuation.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengeContinuation({ parts, setButtonStatus, active }) {
  const [unhide, setUnhide] = React.useState(0);
  const id = React.useId();

  function advance(i, done) {
    setUnhide(-1);
    setButtonStatus("right");
  }

  return (
    <>
      <FadeGlideIn key={`${id}-1`} show={active}>
        <StoryQuestionPrompt question={parts[0].prompt} />
      </FadeGlideIn>
      <FadeGlideIn key={`${id}-2`}>
        <StoryTextLine element={parts[1]} unhide={unhide} />
      </FadeGlideIn>
      <FadeGlideIn key={`${id}-3`} show={active}>
        <StoryQuestionMultipleChoice element={parts[2]} advance={advance} />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengeContinuation;
