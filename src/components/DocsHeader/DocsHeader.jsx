import React from "react";
import styles from "./DocsHeader.module.css";
import Link from "next/link";

function DocsHeader() {
  return (
    <>
      <div className={styles.navbar}>
        <div className={styles.navbar_inner}>
          <div className={styles.navbar_logo}>
            <Link href="/">Duostories</Link>
          </div>
          <button id="search" className={styles.search}>
            <span>
              <span>Search Documentation...</span>
            </span>
            <span>CtrlK</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default DocsHeader;
