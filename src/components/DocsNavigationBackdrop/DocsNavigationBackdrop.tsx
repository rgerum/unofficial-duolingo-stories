"use client";
import React from "react";
import { docsBackdropClass } from "../Docs/docsClasses";

export const showNavContext = React.createContext({
  show: false,
  setShow: (value: boolean) => {},
});

function DocsNavigationBackdrop({ children }: { children: React.ReactNode }) {
  const [show, setShow] = React.useState(false);
  return (
    <showNavContext.Provider value={{ show, setShow }}>
      {show && (
        <div className={docsBackdropClass} onClick={() => setShow(false)}></div>
      )}

      {children}
    </showNavContext.Provider>
  );
}

export default DocsNavigationBackdrop;
