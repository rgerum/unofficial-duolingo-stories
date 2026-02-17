"use client";

import React from "react";
import SwiperSideBar from "./swipe";
import LayoutFlag from "./layout_flag";
import { LoggedInButtonWrappedClient } from "@/components/login/LoggedInButtonWrappedClient";

export default function EditorLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SwiperSideBar>
      <nav className="[grid-area:header] flex items-center border-b-2 border-[var(--header-border)] px-5">
        <LayoutFlag />
        <LoggedInButtonWrappedClient page={"editor"} course_id={"segment"} />
      </nav>
      <div className="[grid-area:main] overflow-x-hidden overflow-y-scroll">
        {children}
      </div>
    </SwiperSideBar>
  );
}
