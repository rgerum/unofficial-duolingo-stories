import React from "react";
import styles from "./StoryChallengeMatch.module.css";
import StoryQuestionMatch from "../StoryQuestionMatch";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengeMatch({ parts, active, setButtonStatus }) {
  const id = React.useId();
  return (
    <FadeGlideIn key={`${id}-1`} show={active}>
      <StoryQuestionMatch
        element={parts[0]}
        setDone={() => setButtonStatus("right")}
      />
    </FadeGlideIn>
  );
}

export default StoryChallengeMatch;
