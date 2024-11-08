import styles from "./layout.module.css";
import React from "react";
import { auth } from "@/auth";
import {
  get_course_list_data,
  get_language_list_data,
} from "./db_get_course_editor";

import SwiperSideBar from "./swipe";
import LayoutFlag from "./layout_flag";
import LoggedInButton, { LogInButton } from "@/components/login/loggedinbutton";

export default async function Layout({ children }) {
  const session = await auth();

  let courses = await get_course_list_data();
  let languages = await get_language_list_data();

  return (
    <SwiperSideBar courses={courses} languages={languages}>
      <nav className={styles.header_index}>
        <LayoutFlag courses={courses} languages={languages} />

        {session?.user ? (
          <LoggedInButton
            page={"editor"}
            course_id={"segment"}
            session={session}
          />
        ) : (
          <LogInButton />
        )}
      </nav>
      <div className={styles.main_overview}>{children}</div>
    </SwiperSideBar>
  );
} // <Login page={"editor"} course_id={course?.short}/>s
