import React from "react";
import styles from "./StoryChallengeMatch.module.css";
import StoryQuestionMatch from "../StoryQuestionMatch";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengeMatch({
  parts,
  active,
  hidden,
  setButtonStatus,
  settings,
}) {
  const id = React.useId();
  if (settings.hide_questions) {
    return null;
  }
  return (
    <FadeGlideIn
      key={`${id}-1`}
      show={active || settings.show_all}
      hidden={hidden}
    >
      <StoryQuestionMatch
        element={parts[0]}
        setDone={() => setButtonStatus("right")}
      />
    </FadeGlideIn>
  );
}

export default StoryChallengeMatch;
