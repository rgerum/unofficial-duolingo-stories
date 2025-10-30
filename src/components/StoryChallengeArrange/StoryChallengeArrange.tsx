import React from "react";
import styles from "./StoryChallengeArrange.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionArrange from "../StoryQuestionArrange";
import FadeGlideIn from "../FadeGlideIn";

function StoryChallengeArrange({
  parts,
  active,
  hidden,
  setButtonStatus,
  settings,
}: {
  parts: any[];
  active: boolean;
  hidden: boolean;
  setButtonStatus: (status: string) => void;
  settings: any;
}) {
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
      <FadeGlideIn
        key={`${id}-1`}
        show={active || settings.show_all}
        hidden={hidden}
      >
        <StoryQuestionPrompt question={parts[0].prompt} lang={parts[0].lang} />
      </FadeGlideIn>
      <FadeGlideIn key={`${id}-2`} hidden={hidden}>
        <StoryTextLine
          active={active}
          element={parts[1]}
          unhide={unhide}
          settings={settings}
        />
      </FadeGlideIn>
      <FadeGlideIn
        key={`${id}-3`}
        show={active || settings.show_all}
        hidden={hidden}
      >
        <StoryQuestionArrange
          element={parts[2]}
          active={active}
          advance={advance}
        />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengeArrange;
