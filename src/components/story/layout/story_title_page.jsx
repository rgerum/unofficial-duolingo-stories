import styles from "./story_title_page.module.css";

import React from "react";

export function StoryTitlePage({ story, controls, localization }) {
  let header = story.elements[0];

  return (
    <div className={styles.story_title_page}>
      <div>
        <img width="180" src={header.illustrationUrl} alt={"title image"} />
      </div>
      <h1 className={styles.story_title_page_title}>{header.title}</h1>
      <div>
        <button className={styles.button} onClick={controls.next}>
          {localization("button_start_story") || "Start Story"}
        </button>
      </div>
    </div>
  );
}
