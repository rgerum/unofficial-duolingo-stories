import React from "react";
import styles from "./StoryFinishedScreen.module.css";
import useScrollIntoView from "@/hooks/use-scroll-into-view.hook";
import { useLocalisation } from "../LocalisationProvider/LocalisationProviderContext";

function StoryFinishedScreen({ story }) {
  const localisation = useLocalisation();
  const ref = useScrollIntoView(true);

  return (
    <div
      ref={ref}
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
        <h2>{localisation("story_finished")}</h2>
        <p>
          {localisation("story_finished_subtitle", {
            $story_title: story.from_language_name,
          }) || `You finished ${story.from_language_name}`}
        </p>
      </div>
    </div>
  );
}

export default StoryFinishedScreen;
