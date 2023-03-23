import Head from 'next/head'
import Link from "next/link";

import Layout from '../../components/editor/course/layout'
import {get_courses_ungrouped} from "../api/course";
import CourseList from "../../components/editor/course/course_list";
import styles from "./course/[course]/index.module.css"

function Page({courses, userdata}) {
    // Render data...
    let course_id = undefined;
    return <>
        <Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <link rel="canonical" href="https://www.duostories.org" />
            <meta name="description" content={`Supplement your Duolingo course with community-translated Duolingo stories.`}/>
            <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
        <Layout userdata={userdata}>
            <div className={styles.root}>
                <CourseList courses={courses} course_id={course_id} />
                <div className={styles.main_overview}>
                    <p id="no_stories">Click on one of the courses to display its stories.</p>
                </div>
            </div>
        </Layout>
    </>
}



// This gets called on every request
export async function getStaticProps(params) {
    //let response_courses = await fetch(`https://test.duostories.org/stories/backend_node_test/courses`);
    //let courses =  await response_courses.json();
    let courses = await get_courses_ungrouped();

    // Pass data to the page via props
    return { props: { courses } }
}

export default Page
