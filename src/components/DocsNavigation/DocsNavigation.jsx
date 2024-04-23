"use client";
import React from "react";
import styles from "./DocsNavigation.module.css";
import Link from "next/link";
import { showNavContext } from "../DocsNavigationBackdrop";
import { useSelectedLayoutSegment } from "next/navigation";
import VisuallyHidden from "../VisuallyHidden";

function DocsNavigation({ data }) {
  const { show, setShow } = React.useContext(showNavContext);

  const segment = useSelectedLayoutSegment();

  return (
    <>
      <div className={styles.toc} id="toc" data-show={show}>
        <button
          className={styles.close}
          id="close"
          onClick={() => setShow(false)}
        >
          <VisuallyHidden>Close Menu</VisuallyHidden>×
        </button>
        <div className={styles.toc_inner}>
          {data.navigation.map((item, i) => (
            <div key={i}>
              {item.group ? <h5>{item.group}</h5> : null}
              <ul>
                {item.pages.map((child, i) => (
                  <li key={i}>
                    <PageLink
                      page={child.slug}
                      title={child.title}
                      setShow={setShow}
                      active={child.slug === segment}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function PageLink({ page, title, active, setShow }) {
  const className = active
    ? `${styles.pageLink} ${styles.active}`
    : styles.pageLink;
  return (
    <Link
      href={`/docs/${page}`}
      className={className}
      onClick={() => setShow(false)}
    >
      {title}
    </Link>
  );
}

export default DocsNavigation;
