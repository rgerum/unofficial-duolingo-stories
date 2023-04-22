import Head from 'next/head'

import Layout from '../../../../components/editor/course/layout'
import {get_courses_ungrouped} from "../../../api/course";
import CourseList from "../../../../components/editor/course/course_list";
import styles from "./index.module.css"
import {get_course_editor} from "../../../api/course/[course_id]";
import EditList from "../../../../components/editor/course/edit_list";
import {getSession} from "next-auth/react";


export default function Page({courses, course, userdata}) {
    // Render data...
    return <>
        <Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <link rel="canonical" href={`https://www.duostories.org/editor/${course.id}`} />
            <meta name="description" content={`Contribute by translating stories.`}/>
            <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
        <Layout userdata={userdata} course={course}>
            <div className={styles.root}>
                <CourseList courses={courses} course_id={course.id} />
                <div className={styles.main_overview}>
                    <EditList course={course} />
                </div>
            </div>
        </Layout>
    </>
}



export async function getServerSideProps(context) {
    const session = await getSession(context);

    if (!session) {
        return {redirect: {destination: '/editor/login', permanent: false,},};
    }
    if (!session.user.role) {
        return {redirect: {destination: '/editor/not_allowed', permanent: false,},};
    }

    let course = await get_course_editor(context.params.course);

    if(!course) {
        return {
            notFound: true,
        }
    }

    let courses = await get_courses_ungrouped();

    // Pass data to the page via props
    return { props: { courses, course } }
}
