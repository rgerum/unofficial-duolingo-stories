import React from "react";
import styles_common from "../common.module.css";
import styles from "./text_line.module.css";

import { EditorHook } from "../editor_hooks";
import HintLineContent from "./line_hints";
import EditorSSMLDisplay from "./audio_edit";
import AudioPlay from "./audio_play";
import useAudio from "./use_audio";
import { EditorContext, StoryContext } from "../story";
import type {
  StoryElementLine,
  StoryElement,
} from "@/components/editor/story/syntax_parser_types";

interface TextLineProps {
  progress: number;
  unhide: number;
  element: StoryElementLine;
  part: StoryElement[];
}

export default function TextLine({
  progress,
  unhide,
  element,
  part,
}: TextLineProps) {
  const editor = React.useContext(EditorContext);
  const controls = React.useContext(StoryContext);

  let active = progress >= element.trackingProperties.line_index;

  if (
    progress - 0.5 === element.trackingProperties.line_index &&
    part.length > 1 &&
    part[1].type === "POINT_TO_PHRASE"
  )
    active = false;

  let hidden = !active ? styles_common.hidden : "";

  let onClick: (() => void) | undefined;
  [hidden, onClick] = EditorHook(hidden, element.editor, editor);

  let [audioRange, playAudio, ref, url] = useAudio(element, progress);

  if (element.line === undefined) return <></>;

  let hideRangesForChallenge = element.hideRangesForChallenge;
  // TODO window.view === undefined && props.progress !== element.trackingProperties.line_index)
  if (progress !== element.trackingProperties.line_index && !editor)
    hideRangesForChallenge = undefined;
  if (controls?.hide_questions) {
    hideRangesForChallenge = undefined;
  }
  if (controls?.auto_play) {
    element.line.content.hintMap = [];
    playAudio = undefined;
  }
  //if(props.progress !== element.trackingProperties.line_index)
  //    hideRangesForChallenge = undefined;
  // <!--                    <span className="audio_reload" id={"audio_reload"+element.line.content.audio.ssml.id} onClick={() => generate_audio_line(window.story_json, element.line.content.audio.ssml.id)}></span>-->
  if (element.line.type === "TITLE")
    return (
      <div
        className={
          styles.title +
          " " +
          styles_common.fadeGlideIn +
          " " +
          hidden +
          " " +
          element.lang
        }
        data-lineno={element?.editor?.block_start_no}
      >
        <span className={styles.title}>
          <audio ref={ref}>
            <source src={url} type="audio/mp3" />
          </audio>
          <AudioPlay onClick={playAudio} />
          <HintLineContent
            audioRange={audioRange}
            hideRangesForChallenge={hideRangesForChallenge}
            content={element.line.content}
          />
        </span>
      </div>
    );
  else if (element.line.type === "CHARACTER" && element.line.avatarUrl)
    return (
      <>
        <div
          className={
            styles.phrase +
            " " +
            styles_common.fadeGlideIn +
            " " +
            hidden +
            " " +
            element.lang
          }
          onClick={onClick}
          data-lineno={element?.editor?.block_start_no}
        >
          <img
            className={
              styles.head + " " + (controls?.rtl ? styles.rtl_head : "")
            }
            src={element.line.avatarUrl}
            alt="head"
          />
          <span
            className={
              styles.bubble + " " + (controls?.rtl ? styles.rtl_bubble : "")
            }
          >
            <audio ref={ref}>
              <source src={url} type="audio/mp3" />
            </audio>
            <AudioPlay onClick={playAudio} />
            <HintLineContent
              audioRange={audioRange}
              hideRangesForChallenge={hideRangesForChallenge}
              unhide={unhide}
              content={element.line.content}
            />
            {editor && element.line.content.audio ? (
              <EditorSSMLDisplay
                ssml={element.line.content.audio.ssml}
                audio={element.line.content.audio}
                element={element}
                editor={editor}
              />
            ) : (
              <></>
            )}
          </span>
        </div>
      </>
    );
  else
    return (
      <div
        className={
          styles.phrase +
          " " +
          styles_common.fadeGlideIn +
          " " +
          hidden +
          " " +
          element.lang
        }
        data-lineno={element?.editor?.block_start_no}
      >
        <span>
          <audio ref={ref}>
            <source src={url} type="audio/mp3" />
          </audio>
          <AudioPlay onClick={playAudio} />
          <HintLineContent
            audioRange={audioRange}
            hideRangesForChallenge={hideRangesForChallenge}
            unhide={unhide}
            content={element.line.content}
          />
          {editor && element.line.content.audio ? (
            <EditorSSMLDisplay
              ssml={element.line.content.audio.ssml}
              audio={element.line.content.audio}
              element={element}
              editor={editor}
            />
          ) : (
            <></>
          )}
        </span>
      </div>
    );
}
