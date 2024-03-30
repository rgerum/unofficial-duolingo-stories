import React from "react";
import styles from "./StoryChallengeArrange.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionArrange from "../StoryQuestionArrange";

function StoryChallengeArrange({ parts, setDone }) {
  let [unhide, setUnhide] = React.useState(0);

  function advance(i, done) {
    setUnhide(i);

    if (done && setDone) {
      setDone();
    }
  }

  return (
    <>
      <StoryQuestionPrompt question={parts[0].prompt} />
      <StoryTextLine element={parts[1]} unhide={unhide} />
      <StoryQuestionArrange element={parts[2]} advance={advance} />
    </>
  );
}

export default StoryChallengeArrange;
