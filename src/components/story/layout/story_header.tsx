import React from "react";
import styles from "./story_header.module.css";
import Link from "next/link";

export default function StoryHeader({
  course,
  progress,
  length,
}: {
  course: string;
  progress?: number;
  length: number;
}) {
  if (progress === undefined) {
    return (
      <div className={styles.header}>
        <div className={styles.header_icon}>
          <Link className={styles.quit} href={"/" + course} data-cy="quit" />
        </div>
      </div>
    );
  }
  return (
    <div className={styles.header}>
      <div className={styles.header_icon}>
        <Link className={styles.quit} href={"/" + course} data-cy="quit" />
      </div>
      <div className={styles.progress}>
        <div
          className={styles.progress_inside}
          style={{ width: (progress / length) * 100 + "%" }}
        >
          <div className={styles.progress_highlight}></div>
        </div>
      </div>
    </div>
  );
}
