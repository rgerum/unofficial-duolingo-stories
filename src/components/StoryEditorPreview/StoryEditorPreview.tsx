"use client";
import React from "react";
import styles from "./StoryEditorPreview.module.css";
import StoryTextLine from "../StoryTextLine";
import StoryHeader from "../StoryHeader";
import StoryQuestionMatch from "../StoryQuestionMatch";
import StoryQuestionArrange from "../StoryQuestionArrange";
import StoryQuestionPointToPhrase from "../StoryQuestionPointToPhrase";
import StoryQuestionSelectPhrase from "../StoryQuestionSelectPhrase";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import type { EditorStateType } from "@/app/editor/story/[story]/editor";
import type { StoryType } from "@/components/editor/story/syntax_parser_new";
import type {
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
  StoryElementMultipleChoice,
  StoryElementChallengePrompt,
} from "@/components/editor/story/syntax_parser_types";
import { getEditorHandlers, type EditorProps } from "../story/editorHandlers";

interface StoryEditorPreviewProps {
  story: StoryType & { learning_language_rtl?: boolean };
  editorState?: EditorStateType;
}

function GetParts(story: StoryType) {
  const parts: StoryElement[][] = [];
  let last_id = -1;
  for (const element of story.elements) {
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

export default function StoryEditorPreview({
  story,
  editorState,
}: StoryEditorPreviewProps) {
  const parts = GetParts(story);

  return (
    <div
      className={
        styles.story + " " + (story.learning_language_rtl ? styles.story_rtl : "")
      }
    >
      {parts.map((part, i) => (
        <EditorPart key={i} part={part} editorState={editorState} />
      ))}
    </div>
  );
}

interface EditorPartProps {
  part: StoryElement[];
  editorState?: EditorStateType;
}

function EditorPart({ part, editorState }: EditorPartProps) {
  const lastElement = part[part.length - 1];
  const trackingProps = lastElement.trackingProperties as {
    challenge_type?: string;
    line_index: number;
  };
  const challenge_type = trackingProps?.challenge_type;

  return (
    <div className="part" data-challengetype={challenge_type}>
      {part.map((element, i) => (
        <EditorElement key={i} element={element} editorState={editorState} />
      ))}
    </div>
  );
}

interface EditorElementProps {
  element: StoryElement;
  editorState?: EditorStateType;
}

function EditorElement({ element, editorState }: EditorElementProps) {
  // Dummy settings for editor mode - show everything
  const editorSettings = {
    hide_questions: false,
    show_all: true,
    show_names: false,
    rtl: false,
    highlight_name: [],
    hideNonHighlighted: false,
    setHighlightName: () => {},
    setHideNonHighlighted: () => {},
    id: 0,
    show_title_page: false,
  };

  if (element.type === "HEADER") {
    return (
      <StoryHeader
        active={true}
        element={element as StoryElementHeader}
        settings={editorSettings}
        editorState={editorState}
      />
    );
  }

  if (element.type === "LINE") {
    return (
      <StoryTextLine
        active={true}
        element={element as StoryElementLine}
        settings={editorSettings}
        editorState={editorState}
      />
    );
  }

  if (element.type === "MULTIPLE_CHOICE") {
    return (
      <EditorQuestionWrapper element={element} editorState={editorState}>
        <StoryQuestionMultipleChoice
          element={element as StoryElementMultipleChoice}
          active={false}
          advance={() => {}}
        />
      </EditorQuestionWrapper>
    );
  }

  if (element.type === "POINT_TO_PHRASE") {
    return (
      <EditorQuestionWrapper element={element} editorState={editorState}>
        <StoryQuestionPointToPhrase
          element={element}
          active={false}
          advance={() => {}}
        />
      </EditorQuestionWrapper>
    );
  }

  if (element.type === "SELECT_PHRASE") {
    return (
      <EditorQuestionWrapper element={element} editorState={editorState}>
        <StoryQuestionSelectPhrase
          element={element}
          active={false}
          advance={() => {}}
        />
      </EditorQuestionWrapper>
    );
  }

  if (element.type === "ARRANGE") {
    return (
      <EditorQuestionWrapper element={element} editorState={editorState}>
        <StoryQuestionArrange
          element={element}
          active={false}
          advance={() => {}}
        />
      </EditorQuestionWrapper>
    );
  }

  if (element.type === "MATCH") {
    return (
      <EditorQuestionWrapper element={element} editorState={editorState}>
        <StoryQuestionMatch element={element} active={false} setDone={() => {}} />
      </EditorQuestionWrapper>
    );
  }

  if (element.type === "CHALLENGE_PROMPT") {
    return (
      <EditorChallengePrompt
        element={element as StoryElementChallengePrompt}
        editorState={editorState}
      />
    );
  }

  if (element.type === "ERROR") {
    return <div className={styles.error}>{element.text}</div>;
  }

  return null;
}

interface EditorQuestionWrapperProps {
  element: Exclude<StoryElement, { type: "ERROR" }>;
  editorState?: EditorStateType;
  children: React.ReactNode;
}

function EditorQuestionWrapper({
  element,
  editorState,
  children,
}: EditorQuestionWrapperProps) {
  const editorProps: EditorProps = {
    editorState,
    editorBlock: element.editor,
  };
  const { onClick } = getEditorHandlers(editorProps);

  return (
    <div onClick={onClick} data-lineno={element.editor?.block_start_no}>
      {children}
    </div>
  );
}

interface EditorChallengePromptProps {
  element: StoryElementChallengePrompt;
  editorState?: EditorStateType;
}

function EditorChallengePrompt({
  element,
  editorState,
}: EditorChallengePromptProps) {
  const editorProps: EditorProps = {
    editorState,
    editorBlock: element.editor,
  };
  const { onClick } = getEditorHandlers(editorProps);

  return (
    <div
      className={styles.challenge_prompt + " " + element.lang}
      onClick={onClick}
      data-lineno={element.editor?.block_start_no}
    >
      <StoryQuestionPrompt question={element.prompt.text} lang={element.lang} />
    </div>
  );
}
