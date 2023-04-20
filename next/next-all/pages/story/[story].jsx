import React from "react";
import Head from 'next/head'

import Story from "../../components/story/story";
import {get_story} from "../api/story/[story_id]";
import {useRouter} from "next/router";

export async function setStoryDone(id) {
    return fetch(`/api/story/${id}/done`, {credentials: 'include'});
}

export default function StoryMain({story}) {
    const router = useRouter();
    let storyFinishedIndexUpdate = async (id) => {await setStoryDone(story.id); }

    return <>
        <Head>
            <title>{`Duostories ${story.learningLanguageLong} from ${story.fromLanguageLong}: ${story.fromLanguageName}`}</title>
            <link rel="canonical" href={`https://www.duostories.org/story/${story.id}`} />
        </Head>
        <Story story={story} storyFinishedIndexUpdate={storyFinishedIndexUpdate} router={router} />
    </>
}

export async function getServerSideProps({params}) {
    // Fetch data from external API
    //const res = await fetch(`https://test.duostories.org/stories/backend_node_test/story/${params.story}`)
    //const story = await res.json()
    const story = await get_story(params.story);

    if(!story) {
        return {
            notFound: true,
        }
    }

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