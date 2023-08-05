import {authOptions} from "pages/api/auth/[...nextauth]";
import React from 'react';

import {get_story, getAvatarsList} from "pages/api/editor/story/get";
import {notFound} from "next/navigation";
import {getServerSession} from "next-auth/next";
import Editor from "./editor"

export default async function Page({params}) {
    const session = await getServerSession(authOptions);

    let story_data = await get_story({id: params.story});

    if(!story_data) {
        notFound()
    }

    let avatar_names = await getAvatarsList(story_data?.learningLanguage);


    return <Editor story_data={story_data} avatar_names={avatar_names} session={session}/>
}
