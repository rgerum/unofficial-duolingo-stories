import React from "react";
import styles from "./StoryChallengePointToPhrase.module.css";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionPointToPhrase from "../StoryQuestionPointToPhrase";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengePointToPhrase({
  parts,
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

  return (
    <>
      <FadeGlideIn show={partProgress !== 1}>
        <StoryTextLine element={parts[0]} />
      </FadeGlideIn>
      <FadeGlideIn show={partProgress === 1}>
        <StoryQuestionPointToPhrase
          element={parts[1]}
          advance={() => setButtonStatus("right")}
        />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengePointToPhrase;
