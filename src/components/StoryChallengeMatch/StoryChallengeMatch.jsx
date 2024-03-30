import React from "react";
import styles from "./StoryChallengeMatch.module.css";
import StoryQuestionMatch from "../StoryQuestionMatch";

function StoryChallengeMatch({ parts }) {
  return <StoryQuestionMatch element={parts[0]} />;
}

export default StoryChallengeMatch;
