import React from "react";
import styles from "./finish_page.module.css";

export default function FinishedPage({ story, localization }) {
  /* The page at the end of the story. */
  return (
    <div
      id="finishedPage"
      className={styles.page_finished}
      data-hidden={false}
      data-cy="finished"
    >
      <div>
        <div className={styles.finished_image_container}>
          {/* add the three blinking stars */}
          <div>
            <div className={styles.star1} />
            <div className={styles.star2} />
            <div className={styles.star3} />
          </div>
          {/* the icon of the story which changes from color to golden */}
          <div className={styles.finished_image}>
            <img src={story.illustrations.active} alt="" />
            <img
              src={story.illustrations.gilded}
              className={styles.image_golden}
              alt=""
            />
          </div>
        </div>
        {/* the text showing that the story is done */}
        <h2>{localization("story_finished")}</h2>
        <p>
          {localization("story_finished_subtitle", {
            $story_title: story.from_language_name,
          }) || `You finished ${story.from_language_name}`}
        </p>
      </div>
    </div>
  );
}
