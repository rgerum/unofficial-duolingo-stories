import React from "react";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionSelectPhrase from "../StoryQuestionSelectPhrase";
import FadeGlideIn from "../FadeGlideIn";
import { StoryElement } from "@/components/editor/story/syntax_parser_types";
import { StorySettings } from "@/components/StoryProgress";

function StoryChallengeSelectPhrases({
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
  if (parts.length !== 3) throw new Error("not the right element");
  const part_one = parts[0];
  if (part_one.type !== "CHALLENGE_PROMPT")
    throw new Error("not the right element");
  const [unhide, setUnhide] = React.useState(0);
  const id = React.useId();

  function advance() {
    setUnhide(-1);
    setButtonStatus("right");
  }

  if (settings.hide_questions) {
    if (active) setButtonStatus("continue");
    return (
      <FadeGlideIn key={`${id}-1`} hidden={hidden}>
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
        <StoryQuestionPrompt question={part_one.prompt} />
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
        <StoryQuestionSelectPhrase
          element={parts[2]}
          active={active}
          advance={advance}
        />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengeSelectPhrases;
