import React from "react";
import Head from 'next/head'

import Story from "../../components/story/story";

export default function StoryMain({story}) {
    if(!story)
        return <div>:-(</div>
    return <>
        <Head>
            <title>{`Duostories ${story.learningLanguageLong} from ${story.fromLanguageLong}: ${story.fromLanguageName}`}</title>
            <link rel="canonical" href={`https://www.duostories.org/story/${story.id}`} />
        </Head>
        <Story story={story} />
    </>
}

export async function getServerSideProps({params}) {
    // Fetch data from external API
    const res = await fetch(`https://test.duostories.org/stories/backend_node_test/story/${params.story}`)
    const story = await res.json()

    // Pass data to the page via props
    return { props: { story } }
}

// This gets called on every request  <Legal/>
export async function getStaticPropsX({params}) {
    // Fetch data from external API
    const res = await fetch(`https://test.duostories.org/stories/backend_node_test/course/${params.story}`)
    const story = await res.json()

    // Pass data to the page via props
    return { props: { story } }
}

export async function getStaticPathsX({}) {
    // Fetch data from external API
    const res = await fetch(`https://test.duostories.org/stories/backend_node_test/courses`)
    const courses = await res.json()

    let paths = [];
    for(let group in courses) {
        for (let course of courses[group]) {
            paths.push({params: {course: `${course.learningLanguage}-${course.fromLanguage}`}})
        }
    }

    // Pass data to the page via props
    return { paths: paths, fallback: false,}
}