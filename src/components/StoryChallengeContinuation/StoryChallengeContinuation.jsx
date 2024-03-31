import React from "react";
import styles from "./StoryChallengeContinuation.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";

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

  if (active) {
    return (
      <>
        <StoryQuestionPrompt question={parts[0].prompt} />
        <StoryTextLine element={parts[1]} unhide={unhide} />
        <StoryQuestionMultipleChoice element={parts[2]} advance={advance} />
      </>
    );
  }
  return <StoryTextLine element={parts[1]} unhide={unhide} />;
}

export default StoryChallengeContinuation;
