
import {get_courses_ungrouped} from "pages/api/course";
import CourseList from "./course_list";
import styles from "./course/[course_id]/index.module.css"
import {getServerSession} from "next-auth/next";
import {authOptions} from "pages/api/auth/[...nextauth]";

export default async function Page({}) {

    const session = await getServerSession(authOptions);


    if (!session) {
        return {redirect: {destination: '/editor/login', permanent: false,},};
    }
    if (!session?.user?.role) {
        return {redirect: {destination: '/editor/not_allowed', permanent: false,},};
    }

    let courses = await get_courses_ungrouped();

    // Render data...
    let course_id = undefined;
    return <>

                <p id="no_stories">Click on one of the courses to display its stories.</p>


    </>
}
