import React from "react";
import styles from "./StoryChallengeArrange.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionArrange from "../StoryQuestionArrange";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengeArrange({ parts, active, setButtonStatus }) {
  const [unhide, setUnhide] = React.useState(0);
  const id = React.useId();

  function advance(i, done) {
    setUnhide(i);

    if (done) {
      setButtonStatus("right");
    }
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
        <StoryQuestionArrange element={parts[2]} advance={advance} />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengeArrange;
