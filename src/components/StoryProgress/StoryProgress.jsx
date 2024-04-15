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
import StoryFooter from "../StoryFooter";
import StoryFinishedScreen from "../StoryFinishedScreen";

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

function Header({ parts, active, setButtonStatus, settings }) {
  if (active) setButtonStatus("continue");

  return (
    <FadeGlideIn>
      <StoryHeader active={active} element={parts[0]} settings={settings} />
    </FadeGlideIn>
  );
}

function Line({ parts, active, setButtonStatus, settings }) {
  if (active) setButtonStatus("continue");
  return (
    <FadeGlideIn>
      <StoryTextLine active={active} element={parts[0]} settings={settings} />
    </FadeGlideIn>
  );
}

function GetParts(story) {
  const parts = [];
  let last_id = -1;
  for (let element of story.elements) {
    if (element.trackingProperties === undefined) {
      continue;
    }
    if (last_id !== element.trackingProperties.line_index) {
      parts.push([]);
      last_id = element.trackingProperties.line_index;
    }
    parts[parts.length - 1].push(element);
  }
  return parts;
}

function getCharacter(parts) {
  for (let element of parts) {
    const value = element?.line?.characterName || element?.line?.characterId;
    if (value) return value;
  }
}

function StoryProgress({ story, parts_list, settings, ...args }) {
  if (story) {
    parts_list = GetParts(story);
  }
  const [partProgress, setPartProgress] = React.useState(0);
  const [buttonStatus, setButtonStatus] = React.useState("wait");
  const [storyProgress, setStoryProgress] = React.useState(0);

  function next() {
    if (buttonStatus === "finished") {
      return;
    }
    if (buttonStatus === "wait") return;
    if (buttonStatus === "idle") {
      setButtonStatus("wait");
      return setPartProgress(partProgress + 1);
    }
    if (buttonStatus === "continue" || buttonStatus === "right") {
      setPartProgress(0);
      setStoryProgress(storyProgress + 1);
      if (storyProgress === parts_list.length - 1) setButtonStatus("finished");
      else setButtonStatus("wait");
    }
  }

  function getIndex(parts) {
    return parts[0].trackingProperties.line_index || 0;
  }

  const part_list_with_component = [];
  const character_list = ["Narrator"];
  for (let parts of parts_list) {
    const character = getCharacter(parts);
    if (character && !character_list.includes(character)) {
      character_list.push(character);
    }
    if (storyProgress >= getIndex(parts) || settings.show_all) {
      if (
        settings.hide_questions &&
        parts[0].trackingProperties?.challenge_type === "match"
      )
        continue;
      part_list_with_component.push({
        parts,
        id: getIndex(parts),
        Component: getComponent(parts),
      });
    }
  }
  console.log(story);

  return (
    <>
      <div>
        {!settings.show_all && (
          <div className={styles.header}>
            <ProgressBar progress={storyProgress} length={parts_list.length} />
          </div>
        )}
        <div className={styles.story}>
          {settings.setHighlightName && (
            <>
              <div className={styles.characterSelector}>
                {character_list.map((character) => (
                  <button
                    key={character}
                    onClick={() => settings.setHighlightName(character)}
                  >
                    {character}
                  </button>
                ))}
              </div>
              <h1>{story.from_language_name}</h1>
            </>
          )}
          <AnimatePresence>
            {part_list_with_component.map(({ Component, id, parts }) => {
              const active =
                storyProgress === getIndex(parts) && !settings.show_all;
              return (
                <Component
                  key={id}
                  parts={parts}
                  partProgress={partProgress}
                  setButtonStatus={
                    active ? setButtonStatus : () => console.log("not allowed")
                  }
                  active={active}
                  settings={settings}
                  {...args}
                ></Component>
              );
            })}
          </AnimatePresence>
          <div className={styles.spacer}></div>
          {storyProgress === parts_list.length && (
            <StoryFinishedScreen story={story} />
          )}
        </div>
        {!settings.show_all && (
          <StoryFooter buttonStatus={buttonStatus} onClick={next} />
        )}
      </div>
    </>
  );
}

export default StoryProgress;
