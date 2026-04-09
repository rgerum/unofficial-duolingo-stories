"use client";

import React from "react";
import SwiperSideBar from "./swipe";
import LayoutFlag from "./layout_flag";
import EditorHeaderShell from "../_components/header_shell";

export default function EditorLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SwiperSideBar>
      <div className="[grid-area:header] min-w-0">
        <EditorHeaderShell />
        <LayoutFlag />
      </div>
      <div
        className="[grid-area:main] min-h-0 min-w-0 overflow-auto"
        // This identifies the scroll container used for course list state
        // restoration when returning from the story editor.
        data-editor-scroll-container="course-main"
      >
        {children}
      </div>
    </SwiperSideBar>
  );
}
