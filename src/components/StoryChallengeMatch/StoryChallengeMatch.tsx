import React from "react";
import styles from "./StoryChallengeMatch.module.css";
import StoryQuestionMatch from "../StoryQuestionMatch";
import FadeGlideIn from "../FadeGlideIn";
import { StorySettings } from "@/components/StoryProgress";

function StoryChallengeMatch({
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
  settings: StorySettings;
}) {
  const id = React.useId();
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
        element={parts[0]}
        setDone={() => setButtonStatus("right")}
      />
    </FadeGlideIn>
  );
}

export default StoryChallengeMatch;
