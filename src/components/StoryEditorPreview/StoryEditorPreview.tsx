"use client";
import React from "react";
import StoryTextLine from "../StoryTextLine";
import StoryHeader from "../StoryHeader";
import StoryQuestionMatch from "../StoryQuestionMatch";
import StoryQuestionArrange from "../StoryQuestionArrange";
import StoryQuestionPointToPhrase from "../StoryQuestionPointToPhrase";
import StoryQuestionSelectPhrase from "../StoryQuestionSelectPhrase";
import StoryQuestionMultipleChoice from "../StoryQuestionMultipleChoice";
import StoryQuestionPrompt from "../StoryQuestionPrompt";
import { useStoryEditorPreferences } from "@/app/editor/_components/story_editor_preferences";
import type { EditorStateType } from "@/app/editor/story/[story]/editor_state";
import type { StoryType } from "@/components/editor/story/syntax_parser_new";
import type {
  StoryElement,
  StoryElementError,
  StoryElementHeader,
  StoryElementLine,
  StoryElementMultipleChoice,
  StoryElementChallengePrompt,
} from "@/components/editor/story/syntax_parser_types";
import {
  getEditorHandlers,
  type EditorProps,
} from "@/lib/editor/editorHandlers";
import { cn } from "@/lib/utils";

interface StoryEditorPreviewProps {
  story: StoryType & { learning_language_rtl?: boolean };
  editorState?: EditorStateType;
  onOpenAudioEditor?: (
    element: StoryElementLine | StoryElementHeader,
  ) => void | Promise<void>;
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
  onOpenAudioEditor,
}: StoryEditorPreviewProps) {
  const parts = GetParts(story);
  const { showHints, showAudio } = useStoryEditorPreferences();

  return (
    <div
      className={cn(
        "px-4 pt-[85px] select-none",
        story.learning_language_rtl && "[direction:rtl]",
      )}
    >
      {parts.map((part, i) => (
        <EditorPart
          key={i}
          part={part}
          editorState={editorState}
          rtl={story.learning_language_rtl ?? false}
          showHints={showHints}
          showAudio={showAudio}
          onOpenAudioEditor={onOpenAudioEditor}
        />
      ))}
    </div>
  );
}

interface EditorPartProps {
  part: StoryElement[];
  editorState?: EditorStateType;
  rtl: boolean;
  showHints: boolean;
  showAudio: boolean;
  onOpenAudioEditor?: (
    element: StoryElementLine | StoryElementHeader,
  ) => void | Promise<void>;
}

function EditorPart({
  part,
  editorState,
  rtl,
  showHints,
  showAudio,
  onOpenAudioEditor,
}: EditorPartProps) {
  const lastElement = part[part.length - 1];
  const trackingProps = lastElement.trackingProperties as {
    challenge_type?: string;
    line_index: number;
  };
  const challenge_type = trackingProps?.challenge_type;

  return (
    <div className="part" data-challengetype={challenge_type}>
      {part.map((element, i) => (
        <EditorElement
          key={i}
          element={element}
          editorState={editorState}
          rtl={rtl}
          showHints={showHints}
          showAudio={showAudio}
          onOpenAudioEditor={onOpenAudioEditor}
        />
      ))}
    </div>
  );
}

interface EditorElementProps {
  element: StoryElement;
  editorState?: EditorStateType;
  rtl: boolean;
  showHints: boolean;
  showAudio: boolean;
  onOpenAudioEditor?: (
    element: StoryElementLine | StoryElementHeader,
  ) => void | Promise<void>;
}

function EditorElement({
  element,
  editorState,
  rtl,
  showHints,
  showAudio,
  onOpenAudioEditor,
}: EditorElementProps) {
  // Dummy settings for editor mode - show everything
  const editorSettings = {
    hide_questions: false,
    show_all: true,
    show_names: false,
    rtl,
    highlight_name: [],
    hideNonHighlighted: false,
    setHighlightName: () => {},
    setHideNonHighlighted: () => {},
    show_hints: true,
    setShowHints: () => {},
    show_audio: true,
    setShowAudio: () => {},
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
        editorShowTranslationsOverride={showHints}
        editorShowAudioDetailsOverride={showAudio}
        onOpenAudioEditor={onOpenAudioEditor}
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
        editorShowTranslationsOverride={showHints}
        editorShowAudioDetailsOverride={showAudio}
        onOpenAudioEditor={onOpenAudioEditor}
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
        <StoryQuestionMatch
          active={false}
          element={element}
          setDone={() => {}}
        />
      </EditorQuestionWrapper>
    );
  }

  if (element.type === "CHALLENGE_PROMPT") {
    return (
      <EditorChallengePrompt
        element={element as StoryElementChallengePrompt}
        editorState={editorState}
        rtl={rtl}
      />
    );
  }

  if (element.type === "ERROR") {
    return <EditorError element={element} editorState={editorState} />;
  }

  return null;
}

function EditorError({
  element,
  editorState,
}: {
  element: StoryElementError;
  editorState?: EditorStateType;
}) {
  const editorProps: EditorProps = {
    editorState,
    editorBlock: element.editor,
  };
  const { onClick } = getEditorHandlers(editorProps);
  const title =
    element.errorKind === "unknown_block"
      ? "Unknown Block"
      : element.errorKind === "invalid_line"
        ? "Unexpected Line"
        : "Parse Error";

  return (
    <div
      className="my-3 cursor-pointer rounded-[10px] border border-[#d97706] border-l-[5px] border-l-[#b45309] bg-[#fff7ed] px-[14px] py-3 text-[#7c2d12]"
      onClick={onClick}
      data-lineno={element.editor?.block_start_no}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[0.92rem] font-bold tracking-[0.02em] uppercase">
          {title}
        </span>
        {element.lineNumber ? (
          <span className="shrink-0 rounded-full bg-[#fed7aa] px-2 py-[2px] text-[0.8rem] font-semibold">
            Line {element.lineNumber}
          </span>
        ) : null}
      </div>
      <div className="text-[0.98rem] font-semibold">{element.text}</div>
      {element.sourceLine ? (
        <code className="mt-[10px] block overflow-x-auto rounded-lg bg-[#ffedd5] px-[10px] py-2 text-[0.9rem] whitespace-pre-wrap text-[#9a3412]">
          {element.sourceLine}
        </code>
      ) : null}
      {element.details ? (
        <div className="mt-2 text-[0.9rem]">{element.details}</div>
      ) : null}
    </div>
  );
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
  rtl: boolean;
}

function EditorChallengePrompt({
  element,
  editorState,
  rtl,
}: EditorChallengePromptProps) {
  const editorProps: EditorProps = {
    editorState,
    editorBlock: element.editor,
  };
  const { onClick } = getEditorHandlers(editorProps);

  return (
    <div
      className={cn("my-4", element.lang, rtl && "[direction:rtl]")}
      onClick={onClick}
      data-lineno={element.editor?.block_start_no}
    >
      <StoryQuestionPrompt question={element.prompt.text} lang={element.lang} />
    </div>
  );
}
