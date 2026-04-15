import React from "react";
import { AnimatePresence } from "framer-motion";
import StoryChallengeMultipleChoice from "../StoryChallengeMultipleChoice";
import StoryChallengeContinuation from "../StoryChallengeContinuation";
import StoryChallengeMatch from "../StoryChallengeMatch";
import StoryChallengeArrange from "../StoryChallengeArrange";
import StoryChallengePointToPhrase from "../StoryChallengePointToPhrase";
import StoryChallengeSelectPhrases from "../StoryChallengeSelectPhrases";
import FadeGlideIn from "../FadeGlideIn";
import StoryTextLine from "../StoryTextLine";
import StoryHeader from "../StoryHeader";
import StoryHeaderProgress from "../StoryHeaderProgress";
import StoryFooter from "../StoryFooter";
import StoryFinishedScreen from "../StoryFinishedScreen";
import StoryTitlePage from "../StoryTitlePage";
import { playSoundEffect } from "@/lib/sound-effects";
import { StoryType } from "@/components/editor/story/syntax_parser_new";
import {
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import { StoryData } from "@/app/(stories)/story/[story_id]/getStory";
import { isTypingTarget } from "@/lib/is-typing-target";
import { cn } from "@/lib/utils";

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
    <FadeGlideIn hidden={hidden} disableScroll={settings.show_all}>
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
      <FadeGlideIn hidden={hidden} disableScroll={settings.show_all}>
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

function shouldSkipStoryPart(
  parts: StoryElement[],
  hideQuestions: boolean,
): boolean {
  return (
    hideQuestions &&
    parts[0].type === "MATCH" &&
    parts[0].trackingProperties?.challenge_type === "match"
  );
}

function getNextVisibleStoryProgress(
  partsList: StoryElement[][],
  currentStoryProgress: number,
  hideQuestions: boolean,
): number {
  let nextStoryProgress = currentStoryProgress + 1;
  while (
    nextStoryProgress < partsList.length &&
    shouldSkipStoryPart(partsList[nextStoryProgress], hideQuestions)
  ) {
    nextStoryProgress += 1;
  }
  return nextStoryProgress;
}

function getVisibleStoryLength(
  partsList: StoryElement[][],
  hideQuestions: boolean,
): number {
  let visibleLength = 0;
  for (const parts of partsList) {
    if (!shouldSkipStoryPart(parts, hideQuestions)) {
      visibleLength += 1;
    }
  }
  return visibleLength;
}

function getVisibleStoryProgress(
  partsList: StoryElement[][],
  storyProgress: number,
  hideQuestions: boolean,
): number {
  if (storyProgress >= partsList.length) {
    return getVisibleStoryLength(partsList, hideQuestions);
  }

  let visibleProgress = 0;
  for (let index = 0; index <= storyProgress; index += 1) {
    if (!shouldSkipStoryPart(partsList[index], hideQuestions)) {
      visibleProgress += 1;
    }
  }

  return Math.max(visibleProgress - 1, 0);
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
  show_hints: boolean;
  setShowHints: React.Dispatch<React.SetStateAction<boolean>>;
  show_audio: boolean;
  setShowAudio: React.Dispatch<React.SetStateAction<boolean>>;
  id: number;
  show_title_page: boolean;
};

function StoryProgress({
  story,
  parts_list,
  settings,
  onEnd,
  onBackToOverview,
  finishedLabel,
  nextStoryPreview,
  showFinishedPrimaryAction,
}: {
  story?: StoryData;
  parts_list?: StoryElement[][];
  settings: StorySettings;
  onEnd: () => void;
  onBackToOverview?: () => void | Promise<void>;
  finishedLabel?: string;
  nextStoryPreview?: {
    id: number;
    title: string;
    active: string;
    gilded: string;
  } | null;
  showFinishedPrimaryAction?: boolean;
}) {
  if (story) {
    parts_list = GetParts(story);
  }
  const initialStoryProgress =
    parts_list && !settings.show_title_page
      ? getNextVisibleStoryProgress(parts_list, -1, settings.hide_questions)
      : -1;
  const [partProgress, setPartProgress] = React.useState(0);
  const [storyProgress, setStoryProgress] =
    React.useState(initialStoryProgress);
  const [buttonStatus, setButtonStatus] = React.useState(() => {
    if (initialStoryProgress === -1) return "continue";
    if (parts_list && initialStoryProgress >= parts_list.length)
      return "finished";
    return "wait";
  });
  const previousButtonStatus = React.useRef(buttonStatus);

  React.useEffect(() => {
    if (previousButtonStatus.current !== buttonStatus) {
      if (buttonStatus === "right") playSoundEffect("right");
      if (buttonStatus === "finished") playSoundEffect("done");
    }
    previousButtonStatus.current = buttonStatus;
  }, [buttonStatus]);

  const queueAutoplayForNextLine = React.useCallback(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("story_autoplay_ts", String(Date.now()));
  }, []);

  const shouldQueueAutoplay =
    buttonStatus === "continue" ||
    buttonStatus === "right" ||
    buttonStatus === "finished";

  React.useEffect(() => {
    if (
      !parts_list ||
      storyProgress < 0 ||
      storyProgress >= parts_list.length ||
      !shouldSkipStoryPart(parts_list[storyProgress], settings.hide_questions)
    ) {
      return;
    }

    const nextStoryProgress = getNextVisibleStoryProgress(
      parts_list,
      storyProgress,
      settings.hide_questions,
    );
    setPartProgress(0);
    setStoryProgress(nextStoryProgress);
    setButtonStatus(
      nextStoryProgress >= parts_list.length ? "finished" : "wait",
    );
  }, [parts_list, settings.hide_questions, storyProgress]);

  const next = React.useCallback(async () => {
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
      const nextStoryProgress = getNextVisibleStoryProgress(
        parts_list,
        storyProgress,
        settings.hide_questions,
      );
      setPartProgress(0);
      setStoryProgress(nextStoryProgress);
      if (nextStoryProgress >= parts_list.length) setButtonStatus("finished");
      else setButtonStatus("wait");
    }
  }, [
    buttonStatus,
    onEnd,
    partProgress,
    parts_list,
    settings.hide_questions,
    storyProgress,
  ]);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key !== " " ||
        event.repeat ||
        isTypingTarget(event.target, { includeButtons: true })
      ) {
        return;
      }

      event.preventDefault();
      if (shouldQueueAutoplay) {
        queueAutoplayForNextLine();
      }
      void next();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, queueAutoplayForNextLine, shouldQueueAutoplay]);

  if (!story || !parts_list) return null;

  const visibleStoryLength = getVisibleStoryLength(
    parts_list,
    settings.hide_questions,
  );
  const visibleStoryProgress =
    storyProgress === -1
      ? undefined
      : getVisibleStoryProgress(
          parts_list,
          storyProgress,
          settings.hide_questions,
        );

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
      if (shouldSkipStoryPart(parts, settings.hide_questions)) continue;
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
          <StoryHeaderProgress
            course={story.course_short}
            setId={story.set_id}
            progress={visibleStoryProgress}
            length={storyProgress === -1 ? undefined : visibleStoryLength}
          />
        )}
        {storyProgress === -1 && !settings.show_all && (
          <StoryTitlePage story={story} next={next} />
        )}
        <div
          className={cn(
            "mx-auto max-w-[500px] p-4 print:w-full print:max-w-full",
            settings.rtl && "[direction:rtl]",
          )}
          data-rtl={settings.rtl ? "true" : undefined}
        >
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
          <div className="h-[33vh]" />
          {storyProgress === parts_list.length && (
            <StoryFinishedScreen
              story={story}
              disableScroll={settings.show_all}
            />
          )}
        </div>
        {!settings.show_all && storyProgress !== -1 && (
          <StoryFooter
            buttonStatus={buttonStatus}
            onClick={next}
            onBackToOverview={onBackToOverview}
            finishedLabel={finishedLabel}
            nextStoryPreview={nextStoryPreview}
            learningLanguageName={story.learning_language_long}
            showFinishedPrimaryAction={showFinishedPrimaryAction}
          />
        )}
      </div>
    </>
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
      <div className="print:hidden">
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
