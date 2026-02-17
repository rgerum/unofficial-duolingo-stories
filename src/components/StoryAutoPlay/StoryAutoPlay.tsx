"use client";
import React from "react";
import styles from "./StoryAutoPlay.module.css";
import StoryTextLine from "../StoryTextLine";
import StoryHeader from "../StoryHeader";
import StoryHeaderProgress from "../StoryHeaderProgress";
import Legal from "../layout/legal";
import type { StoryType } from "@/components/editor/story/syntax_parser_new";
import type {
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";

interface StoryAutoPlayProps {
  story: StoryType & {
    learning_language_rtl?: boolean;
    learning_language?: string;
    from_language?: string;
  };
}

// Settings that disable all interactive features
const autoPlaySettings = {
  hide_questions: true,
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

function clearHints(element: StoryElement): StoryElement {
  // Deep clone and clear hints for auto_play mode
  if (element.type === "LINE") {
    return {
      ...element,
      line: {
        ...element.line,
        content: {
          ...element.line.content,
          hintMap: [],
          hints_pronunciation: [],
        },
      },
    };
  }
  if (element.type === "HEADER") {
    return {
      ...element,
      learningLanguageTitleContent: {
        ...element.learningLanguageTitleContent,
        hintMap: [],
        hints_pronunciation: [],
      },
    };
  }
  return element;
}

export default function StoryAutoPlay({ story }: StoryAutoPlayProps) {
  const parts = GetParts(story);
  const course = `${story.learning_language}-${story.from_language}`;

  const settings = {
    ...autoPlaySettings,
    rtl: story.learning_language_rtl ?? false,
  };

  return (
    <div className={styles.container}>
      <StoryHeaderProgress
        course={course}
        progress={parts.length}
        length={parts.length}
      />
      <div className={styles.main}>
        <div
          className={
            styles.story +
            " " +
            (story.learning_language_rtl ? styles.story_rtl : "")
          }
        >
          <div className={styles.spacer_small_top} />
          <Legal />
          {parts.map((part, partIndex) => (
            <AutoPlayPart
              key={partIndex}
              part={part}
              settings={settings}
            />
          ))}
        </div>
        <div className={styles.spacer_small} />
      </div>
    </div>
  );
}

interface AutoPlayPartProps {
  part: StoryElement[];
  settings: typeof autoPlaySettings & { rtl: boolean };
}

function AutoPlayPart({ part, settings }: AutoPlayPartProps) {
  return (
    <div className="part">
      {part.map((element, i) => (
        <AutoPlayElement key={i} element={element} settings={settings} />
      ))}
    </div>
  );
}

interface AutoPlayElementProps {
  element: StoryElement;
  settings: typeof autoPlaySettings & { rtl: boolean };
}

function AutoPlayElement({ element, settings }: AutoPlayElementProps) {
  // Clear hints for auto_play mode
  const processedElement = clearHints(element);

  if (processedElement.type === "HEADER") {
    return (
      <StoryHeader
        active={true}
        element={processedElement as StoryElementHeader}
        settings={settings}
      />
    );
  }

  if (processedElement.type === "LINE") {
    return (
      <StoryTextLine
        active={true}
        element={processedElement as StoryElementLine}
        settings={settings}
      />
    );
  }

  // Skip questions and other interactive elements in auto_play mode
  return null;
}
