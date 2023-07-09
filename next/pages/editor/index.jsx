import Head from 'next/head'

import Layout from '../../components/editor/course/layout'
import {get_courses_ungrouped} from "../api/course";
import CourseList from "../../components/editor/course/course_list";
import styles from "./course/[course]/index.module.css"
import {getSession} from "next-auth/react";

export default function Page({courses, userdata}) {

    // Render data...
    let course_id = undefined;
    return <>
        <Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <link rel="canonical" href="https://www.duostories.org/editor" />
            <meta name="description" content={`Contribute by translating stories.`}/>
            <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
        <Layout userdata={userdata}>
            <div className={styles.root}>
                <CourseList courses={courses} course_id={course_id} showList={true} />
                <div className={styles.main_overview}>
                    <p id="no_stories">Click on one of the courses to display its stories.</p>
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

    let courses = await get_courses_ungrouped();

    return {
        props: {courses},
    };
}
