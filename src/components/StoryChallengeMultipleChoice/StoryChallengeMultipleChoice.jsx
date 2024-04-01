import React from "react";
import styles from "./StoryChallengeMultipleChoice.module.css";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengeMultipleChoice({
  parts,
  setDone,
  partProgress,
  setButtonStatus,
  active,
}) {
  React.useEffect(() => {
    if (!active) return;
    if (partProgress === 0) {
      setButtonStatus("idle");
    }
  }, [active, partProgress]);

  const id = React.useId();

  const show_question = active && partProgress === 1;

  return (
    <>
      <FadeGlideIn key={`${id}-1`}>
        <StoryTextLine
          key={parts[0].trackingProperties.line_index}
          element={parts[0]}
        />
      </FadeGlideIn>
      <FadeGlideIn key={`${id}-2`} show={show_question}>
        <StoryQuestionMultipleChoice
          element={parts[1]}
          advance={() => {
            setButtonStatus("right");
          }}
        />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengeMultipleChoice;
