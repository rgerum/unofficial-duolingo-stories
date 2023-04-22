import Head from 'next/head'

import Layout from '../../../../../components/editor/course/layout'
import {get_course_import, get_courses_ungrouped} from "../../../../api/course";
import CourseList from "../../../../../components/editor/course/course_list";
import styles from "./../index.module.css"
import {get_course_editor} from "../../../../api/course/[course_id]";
import ImportList from "../../../../../components/editor/course/import_list";
import {getSession} from "next-auth/react";
//import EditList from "../../../../../components/editor/course/edit_list";
//import {get_story, getAvatarsList} from "../../../../api/editor/story/get";


function Page({courses, course, userdata, imports, from}) {
    // Render data...
    return <>
        <Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <link rel="canonical" href={`https://www.duostories.org/editor/${course.id}/import/${from}`} />
            <meta name="description" content={`Contribute by translating stories.`}/>
            <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
        <Layout userdata={userdata} course={course} import_id={from}>
            <div className={styles.root}>
                <CourseList courses={courses} course_id={course.id}  />
                <div className={styles.main_overview}>
                    <ImportList course={course} imports={imports}  import_id={from} />
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
    
    //let response_courses = await fetch(`https://test.duostories.org/stories/backend_node_test/courses`);
    //let courses =  await response_courses.json();
    let courses = await get_courses_ungrouped();

    let imports = await get_course_import(context.params);

    let course = await get_course_editor(context.params.course);

    if(!course || !imports.length) {
        return {
            notFound: true,
        }
    }

    // Pass data to the page via props
    return { props: { courses, course, imports, from: context.params.from} }
}

export default Page
