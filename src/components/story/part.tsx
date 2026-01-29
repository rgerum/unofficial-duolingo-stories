import React from "react";
import styles from "./part.module.css";
import styles_common from "./common.module.css";

import { EditorHook } from "./editor_hooks";

import Header from "./text_lines/header";
import HintLineContent from "./text_lines/line_hints";
import TextLine from "./text_lines/text_line";

import QuestionArrange from "./questions/question_arrange";
import QuestionMatch from "./questions/question_match";
import QuestionMultipleChoice from "./questions/question_multiple_choice";
import QuestionPointToPhrase from "./questions/question_point_to_phrase";
import QuestionSelectPhrase from "./questions/question_select_phrase";
import { EditorContext, StoryContext } from "./story";
import type {
  StoryElement,
  StoryElementChallengePrompt,
} from "@/components/editor/story/syntax_parser_types";
import type { EditorStateType } from "@/app/editor/story/[story]/editor";
import type { StoryControls } from "./types";

interface PartProps {
  part: StoryElement[];
  progress: number;
  editor?: EditorStateType;
  controls?: StoryControls;
  audios?: { [key: string]: HTMLAudioElement };
}

export default function Part(props: PartProps) {
  const lastElement = props.part[props.part.length - 1];
  const trackingProps = lastElement.trackingProperties as {
    challenge_type?: string;
    line_index: number;
  };
  let challenge_type = trackingProps.challenge_type;
  let [unhide, setUnhide] = React.useState(0);
  let is_hidden = props.progress < props.part[0].trackingProperties.line_index;

  let hidden = is_hidden ? styles_common.hidden : "";
  if (props.editor) hidden = "";

  return (
    <div
      className={"part" + " " + hidden}
      data-hidden={is_hidden}
      data-challengetype={challenge_type}
      data-cy={!is_hidden ? "part" : "part_hidden"}
    >
      {props.part.map((element, i) => (
        <StoryLine
          key={i}
          unhide={unhide}
          setUnhide={setUnhide}
          progress={props.progress}
          element={element}
          part={props.part}
        />
      ))}
    </div>
  );
}

interface ChallengePromptProps {
  progress: number;
  element: StoryElementChallengePrompt;
}

function ChallengePrompt({ progress, element }: ChallengePromptProps) {
  const editor = React.useContext(EditorContext);
  let hidden2 =
    progress !== element.trackingProperties.line_index
      ? styles_common.hidden
      : "";

  let onClick: (() => void) | undefined;
  [hidden2, onClick] = EditorHook(hidden2, element.editor, editor);

  return (
    <div
      className={styles_common.fadeGlideIn + " " + hidden2 + " " + element.lang}
      onClick={onClick}
      data-lineno={element?.editor?.block_start_no}
    >
      <span className={styles_common.question}>
        <HintLineContent content={element.prompt} />
      </span>
    </div>
  );
}

interface StoryLineProps {
  element: StoryElement;
  progress: number;
  unhide: number;
  setUnhide: (value: number) => void;
  part: StoryElement[];
}

function StoryLine(props: StoryLineProps) {
  const controls = React.useContext(StoryContext);

  if (props.element.type === "MULTIPLE_CHOICE" && !controls?.hide_questions) {
    return (
      <QuestionMultipleChoice
        setUnhide={props.setUnhide}
        progress={props.progress}
        element={props.element}
      />
    );
  }
  if (props.element.type === "POINT_TO_PHRASE" && !controls?.hide_questions) {
    return (
      <QuestionPointToPhrase
        progress={props.progress}
        element={props.element}
      />
    );
  }
  if (props.element.type === "SELECT_PHRASE" && !controls?.hide_questions) {
    return (
      <QuestionSelectPhrase
        setUnhide={props.setUnhide}
        progress={props.progress}
        element={props.element}
      />
    );
  }
  if (props.element.type === "CHALLENGE_PROMPT" && !controls?.hide_questions) {
    return (
      <ChallengePrompt progress={props.progress} element={props.element} />
    );
  }
  if (props.element.type === "ARRANGE" && !controls?.hide_questions) {
    return (
      <QuestionArrange
        setUnhide={props.setUnhide}
        progress={props.progress}
        element={props.element}
      />
    );
  }
  if (props.element.type === "MATCH" && !controls?.hide_questions) {
    return <QuestionMatch progress={props.progress} element={props.element} />;
  }
  if (props.element.type === "LINE") {
    return (
      <TextLine
        progress={props.progress}
        unhide={props.unhide}
        element={props.element}
        part={props.part}
      />
    );
  }
  if (props.element.type === "HEADER") {
    return <Header progress={props.progress} element={props.element} />;
  }
  if (props.element.type === "ERROR") {
    return <div className={styles.error}>{props.element.text}</div>;
  }
  return null;
}
