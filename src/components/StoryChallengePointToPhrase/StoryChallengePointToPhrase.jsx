import React from "react";
import styles from "./StoryChallengePointToPhrase.module.css";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionPointToPhrase from "../StoryQuestionPointToPhrase";
import FadeGlideIn from "../FadeGlideIn";
import { motion } from "framer-motion";

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

  const id = React.useId();

  return (
    <>
      <FadeGlideIn key={`${id}-1`} show={partProgress !== 1}>
        <StoryTextLine element={parts[0]} />
      </FadeGlideIn>
      <FadeGlideIn key={`${id}-2`} show={partProgress === 1}>
        <StoryQuestionPointToPhrase
          element={parts[1]}
          advance={() => setButtonStatus("right")}
        />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengePointToPhrase;
