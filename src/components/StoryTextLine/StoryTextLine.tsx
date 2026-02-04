import React from "react";
import styles from "./StoryTextLine.module.css";
import useAudio from "./use-audio.hook";
import StoryLineHints from "../StoryLineHints";
import PlayAudio from "../PlayAudio";
import StoryTextLineSimple from "../StoryTextLineSimple";
import EditorSSMLDisplay from "../EditorSSMLDisplay";
import { StoryElementLine } from "@/components/editor/story/syntax_parser_types";
import { StorySettings } from "@/components/StoryProgress";
import type { EditorStateType } from "@/app/editor/story/[story]/editor";
import { getEditorHandlers, type EditorProps } from "@/lib/editor/editorHandlers";

function StoryTextLine({
  active,
  element,
  unhide = 999999,
  settings,
  editorState,
}: {
  active: boolean;
  element: StoryElementLine;
  unhide?: number;
  settings: StorySettings;
  editorState?: EditorStateType;
}) {
  const editorProps: EditorProps = {
    editorState,
    editorBlock: element.editor,
  };
  const { onClick } = getEditorHandlers(editorProps);
  const [audioRange, playAudio, ref, url] = useAudio(element, active);

  if (element.line === undefined) return <></>;

  const hideRangesForChallenge = element.hideRangesForChallenge;

  if (settings?.show_names) {
    const name =
      (element.line.type == "CHARACTER" &&
        (element.line.characterName || element.line.characterId.toString())) ||
      "Narrator";
    if (!settings?.highlight_name.includes(name) && settings.hideNonHighlighted)
      return null;
    return (
      <>
        <StoryTextLineSimple
          speaker={name}
          highlight={settings?.highlight_name.includes(name)}
          id={settings?.id + "-" + element?.trackingProperties?.line_index}
        >
          {element.line.content.text}
        </StoryTextLineSimple>
      </>
    );
  }

  if (element.line.type === "TITLE")
    return (
      <div
        key={element.trackingProperties.line_index}
        className={styles.title + " " + element.lang}
        onClick={onClick}
        data-lineno={element?.editor?.block_start_no}
      >
        <span className={styles.title}>
          <audio ref={ref}>
            <source src={url} type="audio/mp3" />
          </audio>
          <PlayAudio onClick={playAudio} />
          <StoryLineHints
            audioRange={audioRange}
            hideRangesForChallenge={hideRangesForChallenge}
            content={element.line.content}
            editorState={editorState}
          />
        </span>
      </div>
    );
  else if (
    element.line.type === "CHARACTER" &&
    element.line.avatarUrl != undefined
  )
    return (
      <div
        key={element.trackingProperties.line_index}
        className={styles.phrase + " " + element.lang}
        onClick={onClick}
        data-lineno={element?.editor?.block_start_no}
      >
        <img className={styles.head} src={element.line.avatarUrl} alt="head" />
        <span className={styles.bubble}>
          <audio ref={ref}>
            <source src={url} type="audio/mp3" />
          </audio>
          <PlayAudio onClick={playAudio} />
          <StoryLineHints
            audioRange={audioRange}
            hideRangesForChallenge={hideRangesForChallenge}
            unhide={unhide}
            content={element.line.content}
            editorState={editorState}
          />
          {editorState && element.line.content.audio && (
            <EditorSSMLDisplay
              ssml={element.line.content.audio.ssml}
              audio={element.line.content.audio}
              element={element}
              editor={editorState}
            />
          )}
        </span>
      </div>
    );
  else
    return (
      <div
        key={element.trackingProperties.line_index}
        className={styles.phrase + " " + element.lang}
        onClick={onClick}
        data-lineno={element?.editor?.block_start_no}
      >
        <span>
          <audio ref={ref}>
            <source src={url} type="audio/mp3" />
          </audio>
          <PlayAudio onClick={playAudio} />
          <StoryLineHints
            audioRange={audioRange}
            hideRangesForChallenge={hideRangesForChallenge}
            unhide={unhide}
            content={element.line.content}
            editorState={editorState}
          />
          {editorState && element.line.content.audio && (
            <EditorSSMLDisplay
              ssml={element.line.content.audio.ssml}
              audio={element.line.content.audio}
              element={element}
              editor={editorState}
            />
          )}
        </span>
      </div>
    );
}

export default StoryTextLine;
