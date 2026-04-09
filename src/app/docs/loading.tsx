import React from "react";
import {
  docsPageMainClass,
  docsRightTocClass,
  docsRightTocInnerClass,
} from "@/components/Docs/docsClasses";

export default function Loading() {
  return (
    <>
      <div className={docsPageMainClass}>
        <header id="header">
          <div></div>
          <h1>Loading...</h1>
          <div></div>
        </header>
      </div>
      <div className={docsRightTocClass}>
        <div className={docsRightTocInnerClass}></div>
      </div>
    </>
  );
}
