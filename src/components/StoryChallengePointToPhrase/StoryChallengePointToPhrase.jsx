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
  settings,
}) {
  if (active && partProgress === 0) setButtonStatus("idle");

  const id = React.useId();
  const show_question = active && partProgress === 1;

  if (settings.hide_questions) {
    if (active) setButtonStatus("continue");
    return (
      <FadeGlideIn key={`${id}-1`}>
        <StoryTextLine active={active} element={parts[0]} settings={settings} />
      </FadeGlideIn>
    );
  }

  return (
    <>
      <FadeGlideIn key={`${id}-1`} show={!show_question}>
        <StoryTextLine element={parts[0]} settings={settings} />
      </FadeGlideIn>
      <FadeGlideIn key={`${id}-1`} show={show_question}>
        <StoryQuestionPointToPhrase
          active={active}
          element={parts[1]}
          advance={() => setButtonStatus("right")}
        />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengePointToPhrase;
