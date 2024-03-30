import React from "react";
import styles from "./StoryChallengePointToPhrase.module.css";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionPointToPhrase from "../StoryQuestionPointToPhrase";

function StoryChallengePointToPhrase({ parts, setDone }) {
  return (
    <>
      <StoryTextLine element={parts[0]} />
      <StoryQuestionPointToPhrase element={parts[1]} advance={setDone} />
    </>
  );
}

export default StoryChallengePointToPhrase;
