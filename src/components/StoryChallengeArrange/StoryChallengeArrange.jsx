import React from "react";
import styles from "./StoryChallengeArrange.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionArrange from "../StoryQuestionArrange";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengeArrange({ parts, active, setButtonStatus }) {
  let [unhide, setUnhide] = React.useState(0);

  function advance(i, done) {
    setUnhide(i);

    if (done) {
      setButtonStatus("right");
    }
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
        <StoryQuestionArrange element={parts[2]} advance={advance} />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengeArrange;
