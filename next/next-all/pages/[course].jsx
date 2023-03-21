import Head from 'next/head'
import Link from 'next/link'

import Layout from "../components/layout/layout";
import SetList from "../components/layout/set_list";
import MainTitle from "../components/layout/main_title";
import TitleDesc from "../components/layout/title_desc";
import {get_course} from "./api/course/[course_id]";
import {get_courses} from "./api/course";

export default function MainContentSetList({course}) {

    return <>
        <Head>
            <link rel="canonical" href={`https://www.duostories.org/${course.short}`} />
            <title>{`${course.learningLanguageName} Duolingo Stories`}</title>
            <meta name="description" content={`Improve your ${course.learningLanguageName} learning by community-translated Duolingo stories.`}/>
            <meta name="keywords" content={`${course.learningLanguageName}, language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
        <Layout course={course}>
        <header>
            <MainTitle>Unofficial {course.learningLanguageName} Duolingo Stories</MainTitle>
            <TitleDesc>
                Learn {course.learningLanguageName} with {course.count} community translated Duolingo Stories.
            </TitleDesc>
            <TitleDesc>
                If you want to contribute or discuss the stories, meet us on <Link href="https://discord.gg/4NGVScARR3">Discord</Link><br/>
                or learn more about the project in our <Link href={"/faq"}>FAQ</Link>.
            </TitleDesc>
        </header>

        <SetList course={course} />
        <hr/>
        </Layout>
    </>
}

// This gets called on every request  <Legal/>
export async function getStaticProps({params}) {
    // Fetch data from external API
    //const res = await fetch(`https://test.duostories.org/stories/backend_node_test/course/${params.course}`)
    //const course = await res.json()
    const course = await get_course(params.course);

    // Pass data to the page via props
    return { props: { course } }
}

export async function getStaticPaths({}) {
    // Fetch data from external API
    //const res = await fetch(`https://test.duostories.org/stories/backend_node_test/courses`)
    //const courses = await res.json()
    let courses = await get_courses();

    let paths = [];
    for(let group in courses) {
        for (let course of courses[group]) {
            paths.push({params: {course: `${course.learningLanguage}-${course.fromLanguage}`}});
        }
    }

    // Pass data to the page via props
    return { paths: paths, fallback: false,}
}