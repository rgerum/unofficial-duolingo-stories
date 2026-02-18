import React from "react";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";
import FadeGlideIn from "../FadeGlideIn";
import {
  StoryElement,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import { StorySettings } from "@/components/StoryProgress";

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
  const part_one = parts[0];
  const part_two = parts[1];

  React.useEffect(() => {
    if (active && partProgress === 0 && parts.length > 1) {
      setButtonStatus(settings.hide_questions ? "continue" : "idle");
    }
  }, [
    active,
    partProgress,
    parts.length,
    setButtonStatus,
    settings.hide_questions,
  ]);

  const id = React.useId();

  const show_question =
    active && (parts.length > 1 ? partProgress === 1 : partProgress === 0);

  if (settings.hide_questions) {
    if (parts.length === 1) return null;
    return (
      <FadeGlideIn
        key={`${id}-1`}
        hidden={hidden}
        disableScroll={settings.show_all}
      >
        <StoryTextLine
          active={active}
          element={part_one as StoryElementLine}
          settings={settings}
        />
      </FadeGlideIn>
    );
  }

  if (parts.length === 1) {
    if (part_one.type !== "MULTIPLE_CHOICE")
      throw new Error("not the right element");
    return (
      <>
        <FadeGlideIn
          key={`${id}-1`}
          show={show_question || settings.show_all}
          hidden={hidden}
          disableScroll={settings.show_all}
        >
          <StoryQuestionMultipleChoice
            element={part_one}
            active={active}
            advance={() => {
              setButtonStatus("right");
            }}
          />
        </FadeGlideIn>
      </>
    );
  }

  if (part_two.type !== "MULTIPLE_CHOICE")
    throw new Error("not the right element");

  return (
    <>
      <FadeGlideIn
        key={`${id}-1`}
        hidden={hidden}
        disableScroll={settings.show_all}
      >
        <StoryTextLine
          key={part_one.trackingProperties.line_index}
          active={active && partProgress === 0}
          element={part_one as StoryElementLine}
          settings={settings}
        />
      </FadeGlideIn>
      <FadeGlideIn
        key={`${id}-2`}
        show={show_question || settings.show_all}
        hidden={hidden}
        disableScroll={settings.show_all}
      >
        <StoryQuestionMultipleChoice
          element={part_two}
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
