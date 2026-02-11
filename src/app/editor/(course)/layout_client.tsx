"use client";

import React from "react";
import styles from "./layout.module.css";
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
      <nav className={styles.header_index}>
        <LayoutFlag />
        <LoggedInButtonWrappedClient page={"editor"} course_id={"segment"} />
      </nav>
      <div className={styles.main_overview}>{children}</div>
    </SwiperSideBar>
  );
}
