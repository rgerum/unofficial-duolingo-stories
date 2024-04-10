import React from "react";
import styles from "./StoryChallengeSelectPhrases.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionSelectPhrase from "../StoryQuestionSelectPhrase";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengeSelectPhrases({ parts, setButtonStatus, active }) {
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
        <StoryTextLine active={active} element={parts[1]} unhide={unhide} />
      </FadeGlideIn>
      <FadeGlideIn key={`${id}-3`} show={active}>
        <StoryQuestionSelectPhrase element={parts[2]} advance={advance} />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengeSelectPhrases;
