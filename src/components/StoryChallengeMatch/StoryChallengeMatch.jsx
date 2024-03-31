import React from "react";
import styles from "./StoryChallengeMatch.module.css";
import StoryQuestionMatch from "../StoryQuestionMatch";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengeMatch({ parts, active, setButtonStatus }) {
  return (
    <FadeGlideIn show={active}>
      <StoryQuestionMatch
        element={parts[0]}
        setDone={() => setButtonStatus("right")}
      />
    </FadeGlideIn>
  );
}

export default StoryChallengeMatch;
