import React from "react";
import styles from "./StoryTextLine.module.css";
import useAudio from "./use-audio.hook";
import StoryLineHints from "../StoryLineHints";
import PlayAudio from "../PlayAudio";
import StoryTextLineSimple from "../StoryTextLineSimple";

function StoryTextLine({ active, element, unhide = 999999, settings }) {
  const onClick = undefined;
  const [audioRange, playAudio, ref, url] = useAudio(element, active);

  if (element.line === undefined) return <></>;

  const controls = { rtl: false };
  const hideRangesForChallenge = element.hideRangesForChallenge;

  if (settings?.show_names) {
    return (
      <>
        <StoryTextLineSimple
          speaker={
            element?.line?.characterName ||
            element?.line?.characterId ||
            "Narrator"
          }
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
          />
        </span>
      </div>
    );
  else if (element.line.avatarUrl)
    return (
      <div
        key={element.trackingProperties.line_index}
        className={styles.phrase + " " + element.lang}
        onClick={onClick}
        data-lineno={element?.editor?.block_start_no}
      >
        <img
          className={styles.head + " " + (controls.rtl ? styles.rtl_head : "")}
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
          <PlayAudio onClick={playAudio} />
          <StoryLineHints
            audioRange={audioRange}
            hideRangesForChallenge={hideRangesForChallenge}
            unhide={unhide}
            content={element.line.content}
          />
          {}
        </span>
      </div>
    );
  else
    return (
      <div
        key={element.trackingProperties.line_index}
        className={styles.phrase + " " + element.lang}
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
          />
          {}
        </span>
      </div>
    );
}

export default StoryTextLine;
