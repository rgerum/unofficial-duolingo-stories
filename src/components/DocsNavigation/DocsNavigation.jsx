"use client";
import React from "react";
import styles from "./DocsNavigation.module.css";
import Link from "next/link";
import { showNavContext } from "../DocsNavigationBackdrop";

function DocsNavigation({ data, path }) {
  const { show, setShow } = React.useContext(showNavContext);

  return (
    <>
      <div className={styles.toc} id="toc" data-show={show}>
        <button
          className={styles.close}
          id="close"
          onClick={() => setShow(false)}
        >
          ×
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
                      active={"/" + child.slug === path}
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

function PageLink({ page, title, active }) {
  const className = active
    ? `${styles.pageLink} ${styles.active}`
    : styles.pageLink;
  return (
    <Link href={`/docs/${page}`} className={className}>
      {title}
    </Link>
  );
}

function save_tag(tag) {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

export default DocsNavigation;
