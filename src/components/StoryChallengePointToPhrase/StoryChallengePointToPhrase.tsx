import React from "react";
import StoryTextLine from "../StoryTextLine";
import StoryQuestionPointToPhrase from "../StoryQuestionPointToPhrase";
import FadeGlideIn from "../FadeGlideIn";
import {
  StoryElement,
  StoryElementLine,
  StoryElementPointToPhrase,
} from "@/components/editor/story/syntax_parser_types";
import { StorySettings } from "@/components/StoryProgress";

function StoryChallengePointToPhrase({
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
  const question = parts[1] as StoryElementPointToPhrase | undefined;
  // Broken story data can produce a question with nothing to tap; treat it
  // like a plain line so the reader is not stuck without a correct answer.
  const skip_question =
    settings.hide_questions ||
    !question?.transcriptParts?.some((part) => part.selectable);

  React.useEffect(() => {
    if (!active) return;
    if (skip_question) {
      setButtonStatus("continue");
      return;
    }
    if (partProgress === 0) setButtonStatus("idle");
  }, [active, partProgress, setButtonStatus, skip_question]);

  const id = React.useId();
  const show_question = active && partProgress === 1;

  if (skip_question) {
    return (
      <FadeGlideIn
        key={`${id}-1`}
        hidden={hidden}
        disableScroll={settings.show_all}
      >
        <StoryTextLine
          active={active}
          element={parts[0] as StoryElementLine}
          settings={settings}
        />
      </FadeGlideIn>
    );
  }

  return (
    <>
      <FadeGlideIn
        key={`${id}-1`}
        show={!show_question}
        hidden={hidden}
        disableScroll={settings.show_all}
      >
        <StoryTextLine
          element={parts[0] as StoryElementLine}
          settings={settings}
          active={active && partProgress === 0}
        />
      </FadeGlideIn>
      <FadeGlideIn
        key={`${id}-2`}
        show={show_question || settings.show_all}
        hidden={hidden}
        disableScroll={settings.show_all}
      >
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
