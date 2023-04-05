import Head from 'next/head'

import Layout from '../../../../components/editor/course/layout'
import {get_courses_ids, get_courses_ungrouped} from "../../../api/course";
import CourseList from "../../../../components/editor/course/course_list";
import styles from "./index.module.css"
import {get_course_editor} from "../../../api/course/[course_id]";
import EditList from "../../../../components/editor/course/edit_list";


function Page({courses, course, userdata}) {
    // Render data...
    return <>
        <Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <link rel="canonical" href="https://www.duostories.org" />
            <meta name="description" content={`Supplement your Duolingo course with community-translated Duolingo stories.`}/>
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



// This gets called on every request
export async function getStaticProps({params}) {
    //let response_courses = await fetch(`https://test.duostories.org/stories/backend_node_test/courses`);
    //let courses =  await response_courses.json();
    let courses = await get_courses_ungrouped();

    let course = await get_course_editor(params.course);

    // Pass data to the page via props
    return { props: { courses, course } }
}

export async function getStaticPaths({}) {
    // Fetch data from external API
    //const res = await fetch(`https://test.duostories.org/stories/backend_node_test/courses`)
    //const courses = await res.json()
    let courses = await get_courses_ids();

    let paths = [];
    for(let course of courses) {
        paths.push({params: {course: `${course.id}`}});
    }
    //console.log("paths", paths)

    // Pass data to the page via props
    return { paths: paths, fallback: false,}
}

export default Page
