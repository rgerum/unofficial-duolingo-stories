import styles from "./story_title_page.module.css";

import React from "react";
import { StoryTypeExtended } from "@/app/editor/story/[story]/editor";
import { LocalisationFunc } from "@/lib/get_localisation";
import { StoryElementHeader } from "@/components/editor/story/syntax_parser_types";

export function StoryTitlePage({
  story,
  controls,
  localization,
}: {
  story: StoryTypeExtended;
  controls: {
    next: () => void;
  };
  localization: LocalisationFunc;
}) {
  const header = story.elements[0] as StoryElementHeader;

  return (
    <div className={styles.story_title_page}>
      <div>
        <img width="180" src={header.illustrationUrl} alt={"title image"} />
      </div>
      <h1 className={styles.story_title_page_title}>{header.title}</h1>
      <div>
        <button className={styles.button} onClick={controls.next}>
          {localization("button_start_story")}
        </button>
      </div>
    </div>
  );
}
