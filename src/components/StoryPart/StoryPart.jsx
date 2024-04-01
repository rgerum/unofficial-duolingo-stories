import React from "react";
import styles from "./StoryPart.module.css";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";
import StoryQuestionPointToPhrase from "../StoryQuestionPointToPhrase";
import StoryQuestionSelectPhrase from "../StoryQuestionSelectPhrase";
import StoryQuestionArrange from "../StoryQuestionArrange";
import StoryQuestionMatch from "../StoryQuestionMatch";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import FadeGlideIn from "../FadeGlideIn";

function StoryLine({ element }) {
  //const controls = React.useContext(StoryContext);

  if (element.type === "MULTIPLE_CHOICE") {
    return <StoryQuestionMultipleChoice element={element} />;
  }
  if (element.type === "POINT_TO_PHRASE") {
    return <StoryQuestionPointToPhrase element={element} />;
  }
  if (element.type === "SELECT_PHRASE") {
    return <StoryQuestionSelectPhrase element={element} />;
  }
  if (element.type === "CHALLENGE_PROMPT") {
    return <StoryQuestionPrompt question={element.prompt} />;
  }
  if (element.type === "ARRANGE") {
    return <StoryQuestionArrange element={element} />;
  }
  if (element.type === "MATCH") {
    return <StoryQuestionMatch element={element} />;
  }
  if (element.type === "LINE") {
    return <StoryTextLine element={element} />;
  }
  /*  if (element.type === "HEADER") {
    return <Header element={element} />;
  }
  if (element.type === "ERROR") {
    return <div className={styles.error}>{element.text}</div>;
  }*/
  return null;
}

function StoryPart({ progress, elements }) {
  const id = React.useId();

  return (
    <div>
      {elements.map((element) => (
        <FadeGlideIn key={`${id}-1`}>
          <StoryLine element={element} />
        </FadeGlideIn>
      ))}
    </div>
  );
}

export default StoryPart;
