import {authOptions} from "app/api/auth/[...nextauth]/route";
import React from 'react';

import {notFound} from "next/navigation";
import {getServerSession} from "next-auth/next";
import Editor from "./editor"

import {query_one_obj, query_objs} from  "lib/db";


async function get_story({id}) {
    return await query_one_obj(`SELECT story.id, c.official as official, course_id, duo_id, image, story.name, set_id, set_index, text, c.short, c.learningLanguage as learningLanguage, c.fromLanguage as fromLanguage FROM story JOIN course c on story.course_id = c.id WHERE story.id = ? LIMIT 1`, [id]);
}

async function get_avatar_names({id, course_id}) {
    if(id === 0) {
        return await query_objs(`SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker FROM avatar_mapping RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id WHERE (language_id = (SELECT learningLanguage FROM course WHERE id = ?) or language_id is NULL) ORDER BY a.id`, [course_id]);
    }
    else {
        return await query_objs(`SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker FROM (SELECT * FROM avatar_mapping WHERE language_id = ?) as avatar_mapping RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id ORDER BY a.id`, [id]);
    }
}

async function getAvatarsList(id) {
    if (!id)
        return {}
    let avatar_names_list = await get_avatar_names({id});
    let avatar_names = {}
    for (let avatar of avatar_names_list) {
        avatar_names[avatar.avatar_id] = avatar;
    }
    return avatar_names;
}

export async function generateMetadata({ params }) {
    let story_data = await get_story({id: params.story});

    if(!story_data)
        notFound();

    return {
        title: `Duostories ${story_data.learningLanguageLong} from ${story_data.fromLanguageLong}: ${story_data.fromLanguageName}`,
        alternates: {
            canonical: `https://duostories.org/editor/story/${story_data.id}`,
        },
    }
}

export default async function Page({params}) {
    const session = await getServerSession(authOptions);

    let story_data = await get_story({id: params.story});

    if(!story_data) {
        notFound()
    }

    let avatar_names = await getAvatarsList(story_data?.learningLanguage);


    return <Editor story_data={story_data} avatar_names={avatar_names} session={session}/>
}
