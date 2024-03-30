import React from "react";
import styles from "./StoryChallengeMultipleChoice.module.css";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";

function StoryChallengeMultipleChoice({ parts, setDone }) {
  return (
    <>
      <StoryTextLine element={parts[0]} />
      <StoryQuestionMultipleChoice element={parts[1]} advance={setDone} />
    </>
  );
}

export default StoryChallengeMultipleChoice;
