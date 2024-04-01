import React from "react";
import styles from "./ProgressBar.module.css";

function ProgressBar({ progress, length }) {
  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin="0"
      aria-valuemax={length}
    >
      <div
        className={styles.progress_inside}
        style={{ "--width": (progress / length) * 100 + "%" }}
      >
        <div className={styles.progress_highlight} />
      </div>
    </div>
  );
}

export default ProgressBar;
