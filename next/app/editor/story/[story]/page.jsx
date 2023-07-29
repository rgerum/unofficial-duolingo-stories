import {authOptions} from "pages/api/auth/[...nextauth]";
import React from 'react';

import {get_story, getAvatarsList} from "pages/api/editor/story/get";
import {notFound} from "next/navigation";
import {getServerSession} from "next-auth/next";
import Editor from "./editor"

export default async function EditorNode({params}) {
    const session = await getServerSession(authOptions);

    const userdata = undefined;
    if (!session) {
        return {redirect: {destination: '/editor/login', permanent: false,},};
    }
    if (!session.user.role) {
        return {redirect: {destination: '/editor/not_allowed', permanent: false,},};
    }

    //let response_courses = await fetch(`https://test.duostories.org/stories/backend_node_test/courses`);
    //let courses =  await response_courses.json();
    let story_data = await get_story({id: params.story});

    if(!story_data) {
        notFound()
    }

    let avatar_names = await getAvatarsList(story_data?.learningLanguage);


    return <Editor story_data={story_data} avatar_names={avatar_names} userdata={userdata}/>
}
