"use client";
import React from "react";
import styles from "./DocsBreadCrumbNav.module.css";
import { showNavContext } from "../DocsNavigationBackdrop";

function DocsBreadCrumbNav({ datax }) {
  const { setShow } = React.useContext(showNavContext);
  return (
    <>
      <div className={styles.short_nav}>
        <button
          className={styles.unstyledButton}
          onClick={() => setShow(() => setShow(true))}
        >
          <svg
            id="toggle"
            width="30"
            height="30"
            version="1.1"
            viewBox="0 0 3.175 3.175"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              fill="none"
              stroke="#000"
              strokeLinecap="square"
              strokeWidth=".28222"
            >
              <path d="m0.80839 0.88828h1.5582" />
              <path d="m0.80839 1.5875h1.5582" />
              <path d="m0.80839 2.2867h1.5582" />
            </g>
          </svg>
        </button>
        <span>
          {datax.group ? `${datax.group} › ` : null} <b>{datax.title}</b>
        </span>
      </div>
    </>
  );
}

export default DocsBreadCrumbNav;
