import React from "react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";

import styles from "./StoryProgress.module.css";
import StoryChallengeMultipleChoice from "../StoryChallengeMultipleChoice";
import StoryChallengeContinuation from "../StoryChallengeContinuation";
import StoryChallengeMatch from "../StoryChallengeMatch";
import StoryChallengeArrange from "../StoryChallengeArrange";
import StoryChallengePointToPhrase from "../StoryChallengePointToPhrase";
import StoryChallengeSelectPhrases from "../StoryChallengeSelectPhrases";
import FadeGlideIn from "../FadeGlideIn";
import StoryTextLine from "../StoryTextLine";
import StoryHeader from "../StoryHeader";
import ProgressBar from "../ProgressBar";
import StoryFooter from "../StoryFooter";
import StoryFinishedScreen from "../StoryFinishedScreen";
import StoryTitlePage from "../StoryTitlePage";
import VisuallyHidden from "../VisuallyHidden";
import { StoryType } from "@/components/editor/story/syntax_parser_new";
import {
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import { StoryData } from "@/app/(stories)/story/[story_id]/getStory";

function getComponent(parts: StoryElement[]) {
  const last_part = parts[parts.length - 1];
  if (parts[0].type === "HEADER") return Header;
  if (parts[0].trackingProperties?.challenge_type === "arrange")
    return StoryChallengeArrange;
  if (last_part.type === "POINT_TO_PHRASE") return StoryChallengePointToPhrase;
  if (
    last_part.type === "MULTIPLE_CHOICE" &&
    last_part.trackingProperties.challenge_type === "multiple-choice"
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

function Header({
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
  React.useEffect(() => {
    if (active) setButtonStatus("continue");
  }, [active, setButtonStatus]);

  return (
    <FadeGlideIn hidden={hidden}>
      <StoryHeader
        active={active}
        element={parts[0] as StoryElementHeader}
        settings={settings}
      />
    </FadeGlideIn>
  );
}

function Line({
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
  React.useEffect(() => {
    if (active) setButtonStatus("continue");
  }, [active, setButtonStatus]);
  const element = parts[0];
  if (element.type === "LINE") {
    return (
      <FadeGlideIn hidden={hidden}>
        <StoryTextLine active={active} element={element} settings={settings} />
      </FadeGlideIn>
    );
  }
  return <div>error</div>;
}

function GetParts(story: StoryType) {
  const parts: StoryElement[][] = [];
  let last_id = -1;
  for (let element of story.elements) {
    if (element.trackingProperties === undefined) {
      continue;
    }
    if (last_id !== element.trackingProperties.line_index) {
      parts.push([]);
      last_id = element.trackingProperties.line_index;
    }
    if (
      element.type === "MULTIPLE_CHOICE" &&
      (parts.at(-1)?.length ?? 0) > 1 &&
      element.trackingProperties.challenge_type === "multiple-choice"
    )
      parts.push([]);
    parts[parts.length - 1].push(element);
  }
  for (let i = 0; i < parts.length; i++) {
    for (let j = 0; j < parts[i].length; j++) {
      parts[i][j].trackingProperties.line_index = i;
    }
  }
  return parts;
}

function getCharacter(parts: StoryElement[]) {
  for (let element of parts) {
    if (element.type === "LINE" && element.line.type == "CHARACTER") {
      const value = element.line.characterName || element.line.characterId;
      if (value) return value;
    }
  }
}

export type StorySettings = {
  hide_questions: boolean;
  show_all: boolean;
  show_names: boolean;
  rtl: boolean;
  highlight_name: string[];
  hideNonHighlighted: boolean;
  setHighlightName: (name: string[]) => void;
  setHideNonHighlighted: React.Dispatch<React.SetStateAction<boolean>>;
  id: number;
  show_title_page: boolean;
};

function StoryProgress({
  story,
  parts_list,
  settings,
  onEnd,
}: {
  story?: StoryData;
  parts_list?: StoryElement[][];
  settings: StorySettings;
  onEnd: () => void;
}) {
  if (story) {
    parts_list = GetParts(story);
  }
  const [partProgress, setPartProgress] = React.useState(0);
  const [storyProgress, setStoryProgress] = React.useState(
    settings?.show_title_page ? -1 : 0,
  );
  const [buttonStatus, setButtonStatus] = React.useState(
    storyProgress === -1 ? "continue" : "wait",
  );

  if (!story || !parts_list) return null;

  async function next() {
    if (!parts_list) return;
    if (buttonStatus === "finished") {
      setButtonStatus("...");
      await onEnd();
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

  function getIndex(parts: StoryElement[]) {
    return parts[0].trackingProperties.line_index || 0;
  }

  const part_list_with_component = [];
  const character_list: string[] = ["Narrator"];
  for (let parts of parts_list) {
    const character = getCharacter(parts);
    if (character && !character_list.includes(`${character}`)) {
      character_list.push(`${character}`);
    }
    const hidden = !(storyProgress >= getIndex(parts) || settings.show_all);
    if (1) {
      //storyProgress >= getIndex(parts) || settings.show_all) {
      if (
        settings.hide_questions &&
        parts[0].type === "MATCH" &&
        parts[0].trackingProperties?.challenge_type === "match"
      )
        continue;
      part_list_with_component.push({
        parts,
        id: getIndex(parts),
        hidden,
        Component: getComponent(parts),
      });
    }
  }

  return (
    <>
      <div>
        {!settings.show_all && (
          <HeaderProgress
            course_short={story.course_short}
            progress={storyProgress}
            length={storyProgress === -1 ? undefined : parts_list.length}
          />
        )}
        {storyProgress === -1 && !settings.show_all && (
          <StoryTitlePage story={story} next={next} />
        )}
        <div className={styles.story} data-rtl={settings.rtl}>
          {settings.show_names && (
            <>
              <NameButtons
                character_list={character_list}
                highlight_name={settings.highlight_name}
                setHighlightName={settings.setHighlightName}
                setHideNonHighlighted={settings.setHideNonHighlighted}
              />
              <h1>{story.from_language_name}</h1>
            </>
          )}
          <AnimatePresence>
            {part_list_with_component.map(
              ({ Component, id, parts, hidden }) => {
                const active =
                  storyProgress === getIndex(parts) && !settings.show_all;
                return (
                  <Component
                    key={id}
                    parts={parts}
                    partProgress={partProgress}
                    setButtonStatus={
                      active
                        ? setButtonStatus
                        : () => console.log("not allowed")
                    }
                    active={active}
                    settings={settings}
                    hidden={hidden}
                  ></Component>
                );
              },
            )}
          </AnimatePresence>
          <div className={styles.spacer}></div>
          {storyProgress === parts_list.length && (
            <StoryFinishedScreen story={story} />
          )}
        </div>
        {!settings.show_all && storyProgress !== -1 && (
          <StoryFooter buttonStatus={buttonStatus} onClick={next} />
        )}
      </div>
    </>
  );
}

function HeaderProgress({
  course_short,
  progress,
  length,
}: {
  course_short: string;
  progress: number;
  length?: number;
}) {
  return (
    <div className={styles.header}>
      <Link
        className={styles.header_close}
        data-cy="quit"
        href={`/${course_short}`}
      >
        <VisuallyHidden>Back to Course Page</VisuallyHidden>
      </Link>
      {length !== undefined && (
        <ProgressBar progress={progress} length={length} />
      )}
    </div>
  );
}

function NameButtons({
  character_list,
  highlight_name,
  setHighlightName,
  setHideNonHighlighted,
}: {
  character_list: string[];
  highlight_name: string[];
  setHighlightName: (name: string[]) => void;
  setHideNonHighlighted: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <>
      <div className={styles.characterSelector}>
        {character_list.map((character) => (
          <button
            key={character}
            onClick={() => {
              if (highlight_name.includes(character)) {
                const newList = highlight_name.filter((v) => v != character);
                setHighlightName(newList);
              } else {
                const newList = [...highlight_name, character];
                setHighlightName(newList);
              }
            }}
          >
            {character}
          </button>
        ))}
        <button onClick={() => setHideNonHighlighted((i) => !i)}>
          Hide Others
        </button>
      </div>
    </>
  );
}

export default StoryProgress;
