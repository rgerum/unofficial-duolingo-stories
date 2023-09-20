import styles from "./story_title_page.module.css";

import React from "react";

export function StoryTitlePage({ story, controls }) {
  let header = story.elements[0];

  return (
    <div className={styles.story_title_page}>
      <div>
        <img width="180" src={header.illustrationUrl} alt={"title image"} />
      </div>
      <div className={styles.story_title_page_title}>{header.title}</div>
      <div>
        <button className={styles.button} onClick={controls.next}>
          Start Story
        </button>
      </div>
    </div>
  );
}
