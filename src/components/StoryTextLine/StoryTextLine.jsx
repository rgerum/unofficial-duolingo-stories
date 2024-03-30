import React from "react";
import styles from "./StoryTextLine.module.css";
import { EditorContext, StoryContext } from "../story/story";
import styles_common from "../story/common.module.css";
import { EditorHook } from "../story/editor_hooks";
import useAudio from "../story/text_lines/use_audio";
import AudioPlay from "../story/text_lines/audio_play";
import HintLineContent from "../story/text_lines/line_hints";
import EditorSSMLDisplay from "../story/text_lines/audio_edit";

//progress, unhide, element, part
function StoryTextLine({ element, unhide = 0 }) {
  //const editor = React.useContext(EditorContext);
  //const controls = React.useContext(StoryContext);

  //let active = progress >= element.trackingProperties.line_index;
  /*
  if (
      progress - 0.5 === element.trackingProperties.line_index &&
      part.length > 1 &&
      part[1].type === "POINT_TO_PHRASE"
  )
    active = 0;

  let hidden = !active ? styles_common.hidden : "";

  let onClick;
  [hidden, onClick] = EditorHook(hidden, element.editor, editor);
*/
  let onClick = undefined;
  let progress = 0;
  let [audioRange, playAudio, ref, url] = useAudio(element, progress);

  if (element.line === undefined) return <></>;

  //let unhide = 0;
  let controls = { rtl: false };
  let hideRangesForChallenge = element.hideRangesForChallenge;
  // TODO window.view === undefined && props.progress !== element.trackingProperties.line_index)
  //if (progress !== element.trackingProperties.line_index && !editor)
  //  hideRangesForChallenge = undefined;
  //if (controls.hide_questions) {
  //  hideRangesForChallenge = undefined;
  // }
  /*
  if (controls.auto_play) {
    element.line.content.hintMap = [];
    playAudio = undefined;
  }*/
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
  else if (element.line.avatarUrl)
    return (
      <>
        <div
          className={
            styles.phrase +
            " " +
            styles_common.fadeGlideIn +
            " " +
            " " +
            element.lang
          }
          onClick={onClick}
          data-lineno={element?.editor?.block_start_no}
        >
          <img
            className={
              styles.head + " " + (controls.rtl ? styles.rtl_head : "")
            }
            src={element.line.avatarUrl}
            alt="head"
          />
          <span
            className={
              styles.bubble + " " + (controls.rtl ? styles.rtl_bubble : "")
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
            {}
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
          {}
        </span>
      </div>
    );
}

export default StoryTextLine;
