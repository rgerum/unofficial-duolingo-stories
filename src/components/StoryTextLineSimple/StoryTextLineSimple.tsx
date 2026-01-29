import React from "react";
import styles from "./StoryTextLineSimple.module.css";

function StoryTextLineSimple({
  speaker,
  highlight,
  id,
  children,
}: {
  speaker: string;
  highlight: boolean;
  id: string;
  children: React.ReactNode;
}) {
  const className = highlight
    ? `${styles.wrapper} ${styles.highlight}`
    : styles.wrapper;

  return (
    <div className={className}>
      <span className={styles.speaker_name}>{speaker}:</span>
      <span className={styles.text}> {children}</span>
      <span className={styles.id}>{id}</span>
    </div>
  );
}

export default StoryTextLineSimple;
