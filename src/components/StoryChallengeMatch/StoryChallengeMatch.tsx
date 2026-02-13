import React from "react";
import styles from "./StoryChallengeMatch.module.css";
import StoryQuestionMatch from "../StoryQuestionMatch";
import FadeGlideIn from "../FadeGlideIn";
import { StorySettings } from "@/components/StoryProgress";
import type {
  StoryElement,
  StoryElementMatch,
} from "@/components/editor/story/syntax_parser_types";

function StoryChallengeMatch({
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
  const id = React.useId();
  const element = parts[0] as StoryElementMatch;
  if (settings.hide_questions) {
    return null;
  }
  return (
    <FadeGlideIn
      key={`${id}-1`}
      show={active || settings.show_all}
      hidden={hidden}
      disableScroll={settings.show_all}
    >
      <StoryQuestionMatch
        element={element}
        setDone={() => setButtonStatus("right")}
      />
    </FadeGlideIn>
  );
}

export default StoryChallengeMatch;
