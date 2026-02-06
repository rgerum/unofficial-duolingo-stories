import styles from "./layout.module.css";
import React from "react";
import {
  get_course_list_data,
  get_language_list_data,
} from "./db_get_course_editor";

import SwiperSideBar from "./swipe";
import LayoutFlag from "./layout_flag";
import { LoggedInButtonWrappedClient } from "@/components/login/LoggedInButtonWrappedClient";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  let courses = await get_course_list_data();
  let languages = await get_language_list_data();

  return (
    <SwiperSideBar courses={courses} languages={languages}>
      <nav className={styles.header_index}>
        <LayoutFlag courses={courses} languages={languages} />

        <LoggedInButtonWrappedClient page={"editor"} course_id={"segment"} />
      </nav>
      <div className={styles.main_overview}>{children}</div>
    </SwiperSideBar>
  );
} // <Login page={"editor"} course_id={course?.short}/>s
