"use client";
import React from "react";
import styles from "./DocsHeader.module.css";
import Link from "next/link";
import DocsSearchModal from "../DocsSearchModal";

function DocsHeader() {
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");

  function doShow(value) {
    setShowSearch(value);
    setSearchText("");
  }

  return (
    <>
      <DocsSearchModal
        showSearch={showSearch}
        setShowSearch={doShow}
        searchText={searchText}
        setSearchText={setSearchText}
      />
      <div className={styles.navbar}>
        <div className={styles.navbar_inner}>
          <div className={styles.navbar_logo}>
            <Link href="/">Duostories</Link>
          </div>
          <button
            id="search"
            className={styles.search}
            onClick={() => doShow(true)}
          >
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
