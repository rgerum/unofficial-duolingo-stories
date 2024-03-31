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

function Unknown() {
  return <div>Error</div>;
}

function getComponent(parts) {
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
  const [storyProgress, setStoryProgress] = React.useState(1);

  function setDone() {
    setPartProgress(0);
    setStoryProgress(storyProgress + 1);
  }

  function next() {
    console.log("next", buttonStatus);
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

  const part_list_with_component = [];
  for (let parts of parts_list) {
    if (storyProgress >= parts[0].trackingProperties.line_index) {
      part_list_with_component.push({
        parts,
        Component: getComponent(parts),
      });
    }
  }

  return (
    <div>
      <span>{storyProgress}</span> <span>{partProgress}</span>{" "}
      <span>{buttonStatus}</span>
      {part_list_with_component.map(({ Component, parts }) => (
        <Component
          parts={parts}
          partProgress={partProgress}
          setButtonStatus={setButtonStatus}
          setDone={setDone}
          active={storyProgress === parts[0].trackingProperties.line_index}
          {...args}
        ></Component>
      ))}
      <button onClick={next}>Continue {buttonStatus}</button>
    </div>
  );
}

export default StoryProgress;
