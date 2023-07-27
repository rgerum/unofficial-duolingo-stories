'use client'
import React from "react";

import Story from "components/story/story";
import {useRouter} from "next/navigation";


export async function setStoryDone(id) {
    let res = await fetch(`/api/story/${id}/done`, {credentials: 'include'});
    let answer = res.json();
    if(answer?.message === "done")
        return true
    return res;

}
/*
        <Head>
            <title>{`Duostories ${story.learningLanguageLong} from ${story.fromLanguageLong}: ${story.fromLanguageName}`}</title>
            <link rel="canonical" href={`https://www.duostories.org/story/${story.id}`} />
        </Head>
 */
export default async function StoryWrapper({story}) {

    let storyFinishedIndexUpdate = async () => {await setStoryDone(story.id); }
    let router = useRouter()

    return <>
        <Story story={story} router={router} storyFinishedIndexUpdate={storyFinishedIndexUpdate} />
    </>
}