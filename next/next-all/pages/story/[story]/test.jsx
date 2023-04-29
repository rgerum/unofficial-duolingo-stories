import React from "react";
import Head from 'next/head'

import Story from "../../../components/story/story";
import {get_story} from "../../api/story/[story_id]";
import {useRouter} from "next/router";
import {EditorContext} from "../../../components/story/story";
import styles from "../../../components/story/story.module.css";

export default function Page({story}) {
    const navigate = useRouter().push;

    return <>
        <Head>
            <title>{`Duostories ${story.learningLanguageLong} from ${story.fromLanguageLong}: ${story.fromLanguageName}`}</title>
            <link rel="canonical" href={`https://www.duostories.org/story/${story.id}`} />
        </Head>
        <div id={styles.main}>
            <EditorContext.Provider value={{lineno: 3}}>
                <Story story={story} editor={{lineno: 3}} navigate={navigate} />
            </EditorContext.Provider>
        </div>
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
