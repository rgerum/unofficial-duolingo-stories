"use client";
import React from "react";

export const showNavContext = React.createContext({
  show: false,
  setShow: (value: boolean) => {},
});

function DocsNavigationBackdrop({ children }: { children: React.ReactNode }) {
  const [show, setShow] = React.useState(false);
  return (
    <showNavContext.Provider value={{ show, setShow }}>
      {children}
    </showNavContext.Provider>
  );
}

export default DocsNavigationBackdrop;
