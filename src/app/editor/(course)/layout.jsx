import styles from './layout.module.css'
import React from "react";
import {getServerSession} from "next-auth/next";
import {get_courses_ungrouped} from "./db_get_course_editor";
import {authOptions} from "app/api/auth/[...nextauth]/route";
import SwiperSideBar from "./swipe";
import LayoutFlag from "./layout_flag";
import LoggedInButton, {LogInButton} from "components/login/loggedinbutton";


export default async function Layout({ children }) {
    const session = await getServerSession(authOptions);

    let courses = await get_courses_ungrouped();

    return (
    <>
    <nav className={styles.header_index}>
        <LayoutFlag courses={courses}/>

        {(session?.user) ?
            <LoggedInButton page={"editor"} course_id={"segment"} session={session}/> :
            <LogInButton/>
        }
    </nav>
    <div className={styles.main_index}>
        <SwiperSideBar courses={courses}>
            {children}
        </SwiperSideBar>
    </div>
    </>
    )
}// <Login page={"editor"} course_id={course?.short}/>s
