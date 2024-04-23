import React from "react";
import { EditorHook } from "../editor_hooks";
import HintLineContent from "./line_hints";
import EditorSSMLDisplay from "./audio_edit";
import AudioPlay from "./audio_play";

import styles_common from "../common.module.css";
import styles from "./header.module.css";
import useAudio from "./use_audio";
import { EditorContext, StoryContext } from "../story";

export default function Header({ element, progress }) {
  const editor = React.useContext(EditorContext);
  let active = 1;
  let hidden = !active ? styles_common.hidden : "";

  const controls = React.useContext(StoryContext);

  let onClick;
  [hidden, onClick] = EditorHook(hidden, element.editor, editor);

  let [audioRange, playAudio, ref, url] = useAudio(element, progress);

  let hideRangesForChallenge = undefined;

  if (controls.auto_play) {
    element.learningLanguageTitleContent.hintMap = [];
    playAudio = undefined;
  }

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
        <audio ref={ref}>
          <source src={url} type="audio/mp3" />
        </audio>
        <AudioPlay onClick={playAudio} />
        <HintLineContent
          audioRange={audioRange}
          hideRangesForChallenge={hideRangesForChallenge}
          content={element.learningLanguageTitleContent}
        />
        {editor && element.audio ? (
          <EditorSSMLDisplay
            ssml={element.audio.ssml}
            element={element}
            audio={element.audio}
            editor={editor}
          />
        ) : (
          <></>
        )}
      </h1>
    </div>
  );
}
