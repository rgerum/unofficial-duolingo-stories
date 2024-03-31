import React from "react";
import styles from "./StoryChallengeMultipleChoice.module.css";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";

function StoryChallengeMultipleChoice({
  parts,
  setDone,
  partProgress,
  setButtonStatus,
  active,
}) {
  React.useEffect(() => {
    if (!active) return;
    if (partProgress === 1) {
      setButtonStatus("wait");
    }
  }, [active, partProgress]);

  if (active && partProgress === 0) {
    return <StoryTextLine element={parts[0]} />;
  }
  if (active && partProgress === 1) {
    return (
      <>
        <StoryTextLine element={parts[0]} />
        <StoryQuestionMultipleChoice
          element={parts[1]}
          advance={() => {
            setButtonStatus("right");
          }}
        />
      </>
    );
  }
  return <StoryTextLine element={parts[0]} />;
}

export default StoryChallengeMultipleChoice;
