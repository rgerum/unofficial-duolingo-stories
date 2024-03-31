import React from "react";
import styles from "./StoryChallengeSelectPhrases.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionSelectPhrase from "../StoryQuestionSelectPhrase";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengeSelectPhrases({ parts, setButtonStatus, active }) {
  let [unhide, setUnhide] = React.useState(0);

  function advance(i, done) {
    setUnhide(-1);
    setButtonStatus("right");
  }

  return (
    <>
      <FadeGlideIn show={active}>
        <StoryQuestionPrompt question={parts[0].prompt} />
      </FadeGlideIn>
      <FadeGlideIn>
        <StoryTextLine element={parts[1]} unhide={unhide} />
      </FadeGlideIn>
      <FadeGlideIn show={active}>
        <StoryQuestionSelectPhrase element={parts[2]} advance={advance} />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengeSelectPhrases;
