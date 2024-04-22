"use client";
import React from "react";
import styles from "./DocsBreadCrumbNav.module.css";
import { showNavContext } from "../DocsNavigationBackdrop";
import { useSelectedLayoutSegment } from "next/navigation";
import VisuallyHidden from "../VisuallyHidden";

function DocsBreadCrumbNav({ path_titles }) {
  const { setShow } = React.useContext(showNavContext);
  const segment = useSelectedLayoutSegment();
  const current = path_titles[segment];

  return (
    <>
      <div className={styles.short_nav}>
        <button className={styles.unstyledButton} onClick={() => setShow(true)}>
          <VisuallyHidden>Open Menu</VisuallyHidden>
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
          {current && (
            <>
              {current.group ? `${current.group} › ` : null}{" "}
              <b>{current.title}</b>
            </>
          )}
        </span>
      </div>
    </>
  );
}

export default DocsBreadCrumbNav;
