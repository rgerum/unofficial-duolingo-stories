import styles from "./[[...slug]]/layout.module.css";
import React from "react";

export default function Loading() {
  return (
    <>
      <div className={styles.main}>
        <header id="header">
          <div></div>
          <h1>Loading...</h1>
          <div></div>
        </header>
      </div>
      <div className={styles.toc2}>
        <div className={styles.toc2_inner}></div>
      </div>
    </>
  );
}
