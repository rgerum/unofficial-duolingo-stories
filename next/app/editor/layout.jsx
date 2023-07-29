import styles from './layout.module.css'
//import Login from "components/login/login_dialog";
import React from "react";
import {getServerSession} from "next-auth/next";
import {get_courses_ungrouped} from "pages/api/course";
import {authOptions} from "pages/api/auth/[...nextauth]";
import SwiperSideBar from "./swipe";
import LayoutFlag from "./layout_flag";

export default async function Layout({ children, course, import_id, toggleShow }) {

    const session = await getServerSession(authOptions);
    console.log("session", session)
    if (!session) {
        return {redirect: {destination: '/editor/login', permanent: false,},};
    }
    if (!session?.user?.role) {
        return {redirect: {destination: '/editor/not_allowed', permanent: false,},};
    }
    let courses = await get_courses_ungrouped();
    console.log(courses)
    return (
    <>
    <nav className={styles.header_index}>
        <b>Course-Editor</b>
        <LayoutFlag courses={courses}/>


    </nav>
    <div className={styles.main_index}>
        <SwiperSideBar courses={courses}>
            {children}
        </SwiperSideBar>
    </div>
    </>
    )
}// <Login page={"editor"} course_id={course?.short}/>s