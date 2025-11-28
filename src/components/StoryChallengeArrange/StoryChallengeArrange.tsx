import React from "react";
import styles from "./StoryChallengeArrange.module.css";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionArrange from "../StoryQuestionArrange";
import FadeGlideIn from "../FadeGlideIn";
import { StorySettings } from "@/components/StoryProgress";
import { StoryElement } from "@/components/editor/story/syntax_parser_types";

function StoryChallengeArrange({
  parts,
  active,
  hidden,
  setButtonStatus,
  settings,
}: {
  parts: StoryElement[];
  active: boolean;
  hidden: boolean;
  setButtonStatus: (status: string) => void;
  settings: StorySettings;
}) {
  const [unhide, setUnhide] = React.useState(0);
  const id = React.useId();

  if (parts.length !== 3) throw new Error("not the right element");
  const part_one = parts[0];
  if (part_one.type !== "CHALLENGE_PROMPT")
    throw new Error("not the right element");

  function advance(i: number, done: boolean) {
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
        <StoryQuestionPrompt question={part_one.prompt} lang={part_one.lang} />
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
