import React from "react";
import styles from "./StoryHeader.module.css";

import useAudio from "../StoryTextLine/use-audio.hook";
import PlayAudio from "../PlayAudio";
import StoryLineHints from "../StoryLineHints";
import StoryTextLineSimple from "../StoryTextLineSimple";
import EditorSSMLDisplay from "../EditorSSMLDisplay";
import { StoryElementHeader } from "@/components/editor/story/syntax_parser_types";
import { StorySettings } from "@/components/StoryProgress";
import type { EditorStateType } from "@/app/editor/story/[story]/editor";
import {
  getEditorHandlers,
  type EditorProps,
} from "@/lib/editor/editorHandlers";

function StoryHeader({
  active,
  element,
  settings,
  editorState,
  audioRangeOverride,
  hideAudioButton = false,
}: {
  active: boolean;
  element: StoryElementHeader;
  settings: StorySettings;
  editorState?: EditorStateType;
  audioRangeOverride?: number;
  hideAudioButton?: boolean;
}) {
  const editorProps: EditorProps = {
    editorState,
    editorBlock: element.editor,
  };
  const { onClick } = getEditorHandlers(editorProps);
  const [audioRange, playAudio, ref, url] = useAudio(element, active);
  const effectiveAudioRange = audioRangeOverride ?? audioRange;

  const hideRangesForChallenge = undefined;

  if (settings?.show_names) {
    const name = "Narrator";
    if (!settings?.highlight_name.includes(name) && settings.hideNonHighlighted)
      return null;
    return (
      <StoryTextLineSimple
        speaker={"Narrator"}
        highlight={settings?.highlight_name.includes(name)}
        id={settings?.id + "-" + 0}
      >
        {element.learningLanguageTitleContent.text}
      </StoryTextLineSimple>
    );
  }

  return (
    <div
      className={styles.title + " " + element.lang}
      style={{ textAlign: "center" }}
      onClick={onClick}
      data-lineno={element?.editor?.block_start_no}
    >
      <div>
        <img
          alt="title image"
          className={styles.title_img}
          src={element.illustrationUrl}
        />
      </div>
      <h1 className={styles.title}>
        {url && (
          <audio ref={ref}>
            <source src={url} type="audio/mp3" />
          </audio>
        )}
        {!hideAudioButton && <PlayAudio onClick={playAudio} />}
        <StoryLineHints
          audioRange={effectiveAudioRange}
          hideRangesForChallenge={hideRangesForChallenge}
          content={element.learningLanguageTitleContent}
          editorState={editorState}
        />
        {editorState && element.audio && (
          <EditorSSMLDisplay
            ssml={element.audio.ssml}
            element={element}
            audio={element.audio}
            editor={editorState}
          />
        )}
      </h1>
    </div>
  );
}

export default StoryHeader;
