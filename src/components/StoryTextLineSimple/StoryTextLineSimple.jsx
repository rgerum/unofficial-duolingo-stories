import React from "react";
import styles from "./StoryTextLineSimple.module.css";

function StoryTextLineSimple({ speaker, children }) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.speaker_name}>{speaker}:</span>
      <span> {children}</span>
    </div>
  );
}

export default StoryTextLineSimple;
