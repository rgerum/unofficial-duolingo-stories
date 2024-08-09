"use client";
import React from "react";
import styles from "./DocsNavigationBackdrop.module.css";

export const showNavContext = React.createContext();

function DocsNavigationBackdrop({ children }) {
  const [show, setShow] = React.useState(false);
  return (
    <showNavContext.Provider value={{ show, setShow }}>
      {show && (
        <div className={styles.blur2} onClick={() => setShow(false)}></div>
      )}

      {children}
    </showNavContext.Provider>
  );
}

export default DocsNavigationBackdrop;
