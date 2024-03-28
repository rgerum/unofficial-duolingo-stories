import React from "react";
import styles from "./WordButton.module.css";

function WordButton({ status, children, ...delegated }) {
  return (
    <button
      {...delegated}
      disabled={status === "off"}
      className={styles.word_order}
      data-status={status}
    >
      {children}
    </button>
  );
}

export default WordButton;
