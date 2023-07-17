import Head from 'next/head'
import Link from 'next/link'

import Layout from "../../components/layout/layout";
import MainTitle from "../../components/layout/main_title";
import TitleDesc from "../../components/layout/title_desc";
import {get_courses} from "../api/course";
import CourseList from "../../components/layout/course_list";
import {get_counts} from "../api/course/counts";
import query from "../../lib/db";

export default function Page({ counts, courses, userdata}) {

    return <>
        <Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <link rel="canonical" href="https://www.duostories.org" />
            <meta name="description" content={`Supplement your Duolingo course with community-translated Duolingo stories.`}/>
            <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
        <Layout userdata={userdata}>
            <header>
                <MainTitle>Unofficial Duolingo Stories</MainTitle>
                <TitleDesc>
                    A community project to bring the original <Link href="https://www.duolingo.com/stories">Duolingo Stories</Link> to new languages.
                    <br/>{counts.count_stories} stories in {counts.count_courses} courses and counting!
                </TitleDesc>
                <TitleDesc>
                    If you want to contribute or discuss the stories, meet us on <Link href="https://discord.gg/4NGVScARR3">Discord</Link><br/>
                    or learn more about the project in our <Link href={"/faq"}>FAQ</Link>.
                </TitleDesc>
            </header>
            <div>
                <CourseList courses={courses}/>
            </div>
        </Layout>
    </>
}

// This gets called on every request  <Legal/>
export async function getStaticProps({params}) {
    // Fetch data from external API
    //const res = await etch(`https://test.duostories.org/stories/backend_node_test/course_counts`)
    //const counts = await res.json()
    const counts = await get_counts();

    //let response_courses = await fetch(`https://test.duostories.org/stories/backend_node_test/courses`);
    //let courses =  await response_courses.json();
    let courses = await get_courses(params.tag);

    // Pass data to the page via props
    return { props: { counts, courses }, revalidate: 60*60, }
}


export async function getStaticPaths({}) {
    // Fetch data from external API
    //const res = await fetch(`https://test.duostories.org/stories/backend_node_test/courses`)
    //const courses = await res.json()
    let tags = await query(`SELECT * FROM course_tag;`);

    let paths = [];
    for(let tag of tags) {
        if(tag.name !== '')
            paths.push({params: {tag: tag.name}});
    }

    // Pass data to the page via props
    return { paths: paths, fallback: 'blocking',}
}