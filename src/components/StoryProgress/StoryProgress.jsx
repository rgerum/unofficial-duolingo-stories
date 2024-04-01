import React from "react";
import styles from "./StoryProgress.module.css";
import StoryChallengeMultipleChoice from "../StoryChallengeMultipleChoice";
import StoryChallengeContinuation from "../StoryChallengeContinuation";
import StoryChallengeMatch from "../StoryChallengeMatch";
import StoryChallengeArrange from "../StoryChallengeArrange";
import StoryChallengePointToPhrase from "../StoryChallengePointToPhrase";
import StoryChallengeSelectPhrases from "../StoryChallengeSelectPhrases";
import FadeGlideIn from "../FadeGlideIn";
import StoryTextLine from "../StoryTextLine";
import { AnimatePresence } from "framer-motion";
import StoryHeader from "../StoryHeader";
import ProgressBar from "../ProgressBar";

function Unknown() {
  return <div>Error</div>;
}

function getComponent(parts) {
  if (parts[0].type === "HEADER") return Header;
  if (parts[0].trackingProperties?.challenge_type === "arrange")
    return StoryChallengeArrange;
  if (
    parts[parts.length - 1].trackingProperties?.challenge_type ===
    "point-to-phrase"
  )
    return StoryChallengePointToPhrase;
  if (
    parts[parts.length - 1].trackingProperties?.challenge_type ===
    "multiple-choice"
  )
    return StoryChallengeMultipleChoice;
  if (parts[0].trackingProperties?.challenge_type === "continuation")
    return StoryChallengeContinuation;
  if (parts[0].trackingProperties?.challenge_type === "select-phrases")
    return StoryChallengeSelectPhrases;
  if (parts[0].trackingProperties?.challenge_type === "match")
    return StoryChallengeMatch;

  return Line;
}

function Header({ parts, active, setButtonStatus }) {
  React.useEffect(() => {
    if (!active) return;
    setButtonStatus("right");
  }, [active]);
  return (
    <FadeGlideIn>
      <StoryHeader element={parts[0]} />
    </FadeGlideIn>
  );
}

function Line({ parts, active, setButtonStatus }) {
  React.useEffect(() => {
    if (!active) return;
    setButtonStatus("right");
  }, [active]);
  return (
    <FadeGlideIn>
      <StoryTextLine element={parts[0]} />
    </FadeGlideIn>
  );
}

function StoryProgress({ parts_list, ...args }) {
  const [partProgress, setPartProgress] = React.useState(0);
  const [buttonStatus, setButtonStatus] = React.useState("wait");
  const [storyProgress, setStoryProgress] = React.useState(0);

  function setDone() {
    setPartProgress(0);
    setStoryProgress(storyProgress + 1);
  }

  function next() {
    if (buttonStatus === "wait") return;
    if (buttonStatus === "idle") {
      setButtonStatus("wait");
      return setPartProgress(partProgress + 1);
    }
    if (buttonStatus === "right") {
      setPartProgress(0);
      setStoryProgress(storyProgress + 1);
      setButtonStatus("idle");
    }
  }

  function getIndex(parts) {
    return parts[0].trackingProperties.line_index || 0;
  }

  const part_list_with_component = [];
  for (let parts of parts_list) {
    if (storyProgress >= getIndex(parts)) {
      part_list_with_component.push({
        parts,
        id: getIndex(parts),
        Component: getComponent(parts),
      });
    }
  }

  return (
    <>
      <div className={styles.header}>
        <ProgressBar progress={storyProgress} length={parts_list.length} />
      </div>
      <div className={styles.story}>
        <AnimatePresence>
          <span key={"a"}>{storyProgress}</span> <span>{partProgress}</span>{" "}
          <span key={"b"}>{buttonStatus}</span>
          {part_list_with_component.map(({ Component, id, parts }) => (
            <Component
              key={id}
              parts={parts}
              partProgress={partProgress}
              setButtonStatus={setButtonStatus}
              setDone={setDone}
              active={storyProgress === getIndex(parts)}
              {...args}
            ></Component>
          ))}
        </AnimatePresence>
        <div className={styles.spacer}></div>
      </div>
      <div className={styles.footer}>
        <button key={"c"} onClick={next}>
          Continue {buttonStatus}
        </button>
      </div>
    </>
  );
}

export default StoryProgress;
