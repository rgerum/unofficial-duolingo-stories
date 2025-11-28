import React from "react";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";
import FadeGlideIn from "../FadeGlideIn";
import { StoryElement } from "@/components/editor/story/syntax_parser_types";

function StoryChallengeMultipleChoice({
  parts,
  partProgress,
  setButtonStatus,
  active,
  hidden,
  settings,
}: {
  parts: StoryElement[];
  partProgress: number;
  setButtonStatus: (status: string) => void;
  active: boolean;
  hidden: boolean;
  settings: StorySettings;
}) {
  if (active && partProgress === 0 && parts.length > 1)
    setButtonStatus(settings.hide_questions ? "continue" : "idle");

  const id = React.useId();

  const show_question =
    active && (parts.length > 1 ? partProgress === 1 : partProgress === 0);

  if (settings.hide_questions) {
    if (parts.length === 1) return null;
    return (
      <FadeGlideIn key={`${id}-1`} hidden={hidden}>
        <StoryTextLine active={active} element={parts[0]} settings={settings} />
      </FadeGlideIn>
    );
  }

  if (parts.length === 1) {
    return (
      <>
        <FadeGlideIn
          key={`${id}-1`}
          show={show_question || settings.show_all}
          hidden={hidden}
        >
          <StoryQuestionMultipleChoice
            element={parts[0]}
            active={active}
            advance={() => {
              setButtonStatus("right");
            }}
          />
        </FadeGlideIn>
      </>
    );
  }

  return (
    <>
      <FadeGlideIn key={`${id}-1`} hidden={hidden}>
        <StoryTextLine
          key={parts[0].trackingProperties.line_index}
          active={true}
          element={parts[0]}
          settings={settings}
        />
      </FadeGlideIn>
      <FadeGlideIn
        key={`${id}-2`}
        show={show_question || settings.show_all}
        hidden={hidden}
      >
        <StoryQuestionMultipleChoice
          element={parts[1]}
          active={active}
          advance={() => {
            setButtonStatus("right");
          }}
        />
      </FadeGlideIn>
    </>
  );
}

export default StoryChallengeMultipleChoice;
