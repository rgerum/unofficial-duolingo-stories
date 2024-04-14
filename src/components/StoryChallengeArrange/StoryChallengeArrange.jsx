import React from "react";
import styles from "./StoryChallengeArrange.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionArrange from "../StoryQuestionArrange";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengeArrange({ parts, active, setButtonStatus, settings }) {
  const [unhide, setUnhide] = React.useState(0);
  const id = React.useId();

  function advance(i, done) {
    setUnhide(i);

    if (done) {
      setButtonStatus("right");
    }
  }
  if (settings.hide_questions) {
    if (active) setButtonStatus("continue");

    return (
      <FadeGlideIn key={`${id}-1`}>
        <StoryTextLine active={active} element={parts[1]} settings={settings} />
      </FadeGlideIn>
    );
  }

  return (
    <>
      <FadeGlideIn key={`${id}-1`} show={active}>
        <StoryQuestionPrompt question={parts[0].prompt} />
      </FadeGlideIn>
      <FadeGlideIn key={`${id}-2`}>
        <StoryTextLine
          active={active}
          element={parts[1]}
          unhide={unhide}
          settings={settings}
        />
      </FadeGlideIn>
      <FadeGlideIn key={`${id}-3`} show={active}>
        <StoryQuestionArrange element={parts[2]} advance={advance} />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengeArrange;
