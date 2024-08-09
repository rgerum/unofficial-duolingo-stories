import styles from "./[[...slug]]/layout.module.css";
import Link from "next/link";
import Script from "next/script";
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
