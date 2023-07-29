import styles from './layout.module.css'
import React from "react";
import {getServerSession} from "next-auth/next";
import {get_courses_ungrouped} from "pages/api/course";
import {authOptions} from "pages/api/auth/[...nextauth]";
import SwiperSideBar from "./swipe";
import LayoutFlag from "./layout_flag";
import LoggedInButton, {LogInButton} from "components/login/loggedinbutton";


export default async function Layout({ children }) {

    const session = await getServerSession(authOptions);

    if (!session) {
        return {redirect: {destination: '/editor/login', permanent: false,},};
    }
    if (!session?.user?.role) {
        return {redirect: {destination: '/editor/not_allowed', permanent: false,},};
    }
    let courses = await get_courses_ungrouped();

    return (
    <>
    <nav className={styles.header_index}>
        <b>Course-Editor</b>
        <LayoutFlag courses={courses}/>

        {(session?.user) ?
            <LoggedInButton page={"stories"} course_id={undefined} session={session}/> :
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
