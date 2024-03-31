import React from "react";
import styles from "./StoryChallengeContinuation.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengeContinuation({
  parts,
  setDone,
  partProgress,
  setButtonStatus,
  active,
}) {
  let [unhide, setUnhide] = React.useState(0);

  function advance(i, done) {
    setUnhide(-1);
    if (setDone) setButtonStatus("right");
  }

  if (1) {
    return (
      <>
        <FadeGlideIn show={active}>
          <StoryQuestionPrompt question={parts[0].prompt} />
        </FadeGlideIn>
        <FadeGlideIn>
          <StoryTextLine element={parts[1]} unhide={unhide} />
        </FadeGlideIn>
        <FadeGlideIn show={active}>
          <StoryQuestionMultipleChoice element={parts[2]} advance={advance} />
        </FadeGlideIn>
      </>
    );
  }
  return <StoryTextLine element={parts[1]} unhide={unhide} />;
}

export default StoryChallengeContinuation;
