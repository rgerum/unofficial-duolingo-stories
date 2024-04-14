import React from "react";
import styles from "./StoryChallengeMatch.module.css";
import StoryQuestionMatch from "../StoryQuestionMatch";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengeMatch({ parts, active, setButtonStatus, settings }) {
  const id = React.useId();
  if (settings.hide_questions) {
    return null;
  }
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
