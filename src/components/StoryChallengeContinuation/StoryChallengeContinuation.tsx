import React from "react";
import styles from "./StoryChallengeContinuation.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";
import FadeGlideIn from "../FadeGlideIn";
import { StorySettings } from "@/components/StoryProgress";

function StoryChallengeContinuation({
  parts,
  setButtonStatus,
  active,
  hidden,
  settings,
}: {
  parts: any[];
  setButtonStatus: (status: string) => void;
  active: boolean;
  hidden: boolean;
  settings: StorySettings;
}) {
  const [unhide, setUnhide] = React.useState(0);
  const id = React.useId();

  function advance() {
    setUnhide(-1);
    setButtonStatus("right");
  }
  if (settings.hide_questions) {
    if (active) setButtonStatus("continue");
    return (
      <FadeGlideIn
        key={`${id}-1`}
        hidden={hidden}
        disableScroll={settings.show_all}
      >
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
        disableScroll={settings.show_all}
      >
        <StoryQuestionPrompt question={parts[0].prompt} lang={parts[0].lang} />
      </FadeGlideIn>
      <FadeGlideIn
        key={`${id}-2`}
        hidden={hidden}
        disableScroll={settings.show_all}
      >
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
        disableScroll={settings.show_all}
      >
        <StoryQuestionMultipleChoice
          element={parts[2]}
          active={active}
          advance={advance}
        />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengeContinuation;
