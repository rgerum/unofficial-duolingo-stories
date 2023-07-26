import React from "react";

import Story from "components/story/story";
import {get_story} from "pages/api/story/[story_id]";



/*
        <Head>
            <title>{`Duostories ${story.learningLanguageLong} from ${story.fromLanguageLong}: ${story.fromLanguageName}`}</title>
            <link rel="canonical" href={`https://www.duostories.org/story/${story.id}`} />
        </Head>
 */
export default async function Page({params}) {
    const story = await get_story(params.story);

    return <>
        <Story story={story} />
    </>
}