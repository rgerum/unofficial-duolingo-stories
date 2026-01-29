import React from "react";
import styles from "./StoryHeader.module.css";

import useAudio from "../StoryTextLine/use-audio.hook";
import PlayAudio from "../PlayAudio";
import StoryLineHints from "../StoryLineHints";
import StoryTextLineSimple from "../StoryTextLineSimple";
import { StoryElementHeader } from "@/components/editor/story/syntax_parser_types";
import { StorySettings } from "@/components/StoryProgress";

function StoryHeader({
  active,
  element,
  settings,
}: {
  active: boolean;
  element: StoryElementHeader;
  settings: StorySettings;
}) {
  let onClick = undefined;
  const [audioRange, playAudio, ref, url] = useAudio(element, active);

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
        <audio ref={ref}>
          <source src={url} type="audio/mp3" />
        </audio>
        <PlayAudio onClick={playAudio} />
        <StoryLineHints
          audioRange={audioRange}
          hideRangesForChallenge={hideRangesForChallenge}
          content={element.learningLanguageTitleContent}
        />
      </h1>
    </div>
  );
}

export default StoryHeader;
