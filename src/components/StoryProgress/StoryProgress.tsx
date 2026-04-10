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

function getInitialStoryProgress({
  partsList,
  initialFocusLine,
  showTitlePage,
}: {
  partsList?: StoryElement[][];
  initialFocusLine?: number;
  showTitlePage: boolean;
}) {
  if (!partsList || partsList.length === 0) {
    return showTitlePage ? -1 : 0;
  }
  if (!initialFocusLine || initialFocusLine <= 0) {
    return showTitlePage ? -1 : 0;
  }

  const focusedIndex = partsList.findIndex((parts) =>
    parts.some(
      (element) => element.editor?.block_start_no === initialFocusLine,
    ),
  );

  return focusedIndex >= 0 ? focusedIndex : showTitlePage ? -1 : 0;
}

function getInitialPartProgress({
  partsList,
  initialFocusLine,
  storyProgress,
}: {
  partsList?: StoryElement[][];
  initialFocusLine?: number;
  storyProgress: number;
}) {
  if (
    !partsList ||
    storyProgress < 0 ||
    !initialFocusLine ||
    initialFocusLine <= 0
  ) {
    return 0;
  }

  const currentParts = partsList[storyProgress];
  if (!currentParts || currentParts.length < 2) return 0;
  const lastPart = currentParts[currentParts.length - 1];
  if (lastPart.type !== "MULTIPLE_CHOICE") return 0;

  return lastPart.editor?.block_start_no === initialFocusLine ? 1 : 0;
}

function getVisibleEditorLine({
  currentPart,
  partProgress,
}: {
  currentPart?: StoryElement[];
  partProgress: number;
}) {
  if (!currentPart || currentPart.length === 0) return undefined;

  const lastElement = currentPart[currentPart.length - 1];
  if (
    (lastElement.type === "MULTIPLE_CHOICE" ||
      lastElement.type === "POINT_TO_PHRASE") &&
    currentPart.length > 1 &&
    partProgress > 0
  ) {
    return lastElement.editor?.block_start_no;
  }

  return currentPart
    .map((element) => element.editor?.block_start_no)
    .find((lineNumber): lineNumber is number => typeof lineNumber === "number");
}

function StoryProgress({
  story,
  parts_list: providedPartsList,
  editHrefBase,
  initialFocusLine,
  settings,
  onEnd,
  onBackToOverview,
  finishedLabel,
  nextStoryPreview,
  showFinishedPrimaryAction,
}: {
  story?: StoryData;
  parts_list?: StoryElement[][];
  editHrefBase?: string;
  initialFocusLine?: number;
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
  const parts_list = React.useMemo(() => {
    if (providedPartsList) return providedPartsList;
    if (story) return GetParts(story);
    return undefined;
  }, [providedPartsList, story]);
  const initialStoryProgress = getInitialStoryProgress({
    partsList: parts_list,
    initialFocusLine,
    showTitlePage: settings.show_title_page,
  });
  const initialPartProgress = getInitialPartProgress({
    partsList: parts_list,
    initialFocusLine,
    storyProgress: initialStoryProgress,
  });
  const [partProgress, setPartProgress] = React.useState(initialPartProgress);
  const [storyProgress, setStoryProgress] = React.useState(() =>
    getInitialStoryProgress({
      partsList: parts_list,
      initialFocusLine,
      showTitlePage: settings.show_title_page,
    }),
  );
  const [buttonStatus, setButtonStatus] = React.useState(
    initialStoryProgress === -1 ? "continue" : "wait",
  );
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
      setPartProgress(0);
      setStoryProgress(storyProgress + 1);
      if (storyProgress === parts_list.length - 1) setButtonStatus("finished");
      else setButtonStatus("wait");
    }
  }, [buttonStatus, onEnd, partProgress, parts_list, storyProgress]);

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

  const currentPart =
    !parts_list || parts_list.length === 0
      ? undefined
      : storyProgress < 0
        ? parts_list[0]
        : parts_list[Math.min(storyProgress, parts_list.length - 1)];
  const currentEditorLine = getVisibleEditorLine({
    currentPart,
    partProgress,
  });
  const editHref =
    editHrefBase && currentEditorLine
      ? `${editHrefBase}?line=${currentEditorLine}`
      : editHrefBase;

  React.useEffect(() => {
    if (typeof window === "undefined" || !story) return;

    const url = new URL(window.location.href);
    if (currentEditorLine)
      url.searchParams.set("line", String(currentEditorLine));
    else url.searchParams.delete("line");

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl === currentUrl) return;

    window.history.replaceState(window.history.state, "", nextUrl);
  }, [currentEditorLine, story]);

  if (!story || !parts_list) return null;

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
          <StoryHeaderProgress
            course={story.course_short}
            setId={story.set_id}
            progress={storyProgress}
            length={storyProgress === -1 ? undefined : parts_list.length}
            editHref={editHref}
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
