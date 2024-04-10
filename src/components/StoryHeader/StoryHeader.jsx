import React from "react";
import styles from "./StoryHeader.module.css";

import useAudio from "../story/text_lines/use_audio";
import AudioPlay from "../story/text_lines/audio_play";
import HintLineContent from "../story/text_lines/line_hints";

function StoryHeader({ active, element }) {
  let onClick = undefined;
  const [audioRange, playAudio, ref, url] = useAudio(element, active);

  const hideRangesForChallenge = undefined;

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
        <audio ref={ref}>
          <source src={url} type="audio/mp3" />
        </audio>
        <AudioPlay onClick={playAudio} />
        <HintLineContent
          audioRange={audioRange}
          hideRangesForChallenge={hideRangesForChallenge}
          content={element.learningLanguageTitleContent}
        />
      </h1>
    </div>
  );
}

export default StoryHeader;
