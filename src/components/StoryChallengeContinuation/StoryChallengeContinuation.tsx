import React from "react";
import styles from "./StoryChallengeContinuation.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";
import FadeGlideIn from "../FadeGlideIn";
import { StorySettings } from "@/components/StoryProgress";
import type {
  StoryElement,
  StoryElementChallengePrompt,
  StoryElementLine,
  StoryElementMultipleChoice,
} from "@/components/editor/story/syntax_parser_types";

function StoryChallengeContinuation({
  parts,
  setButtonStatus,
  active,
  hidden,
  settings,
}: {
  parts: StoryElement[];
  setButtonStatus: (status: string) => void;
  active: boolean;
  hidden: boolean;
  settings: StorySettings;
}) {
  const [unhide, setUnhide] = React.useState(0);
  const id = React.useId();
  const prompt = parts[0] as StoryElementChallengePrompt;
  const line = parts[1] as StoryElementLine;
  const choice = parts[2] as StoryElementMultipleChoice;

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
        <StoryTextLine active={active} element={line} settings={settings} />
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
        <StoryQuestionPrompt question={prompt.prompt} lang={prompt.lang} />
      </FadeGlideIn>
      <FadeGlideIn
        key={`${id}-2`}
        hidden={hidden}
        disableScroll={settings.show_all}
      >
        <StoryTextLine
          active={active}
          element={line}
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
          element={choice}
          active={active}
          advance={advance}
        />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengeContinuation;
