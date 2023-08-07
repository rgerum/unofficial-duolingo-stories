import React from "react";
import { cache } from 'react'
import {query_objs, query_one_obj} from "lib/db"
import LanguageEditor from "./language_editor";
import {getServerSession} from "next-auth/next";

import {authOptions} from "app/api/auth/[...nextauth]/route";
import {notFound} from "next/navigation";


const get_avatar_names = cache(async (id) => {
    return await query_objs(`
SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker
FROM (SELECT id, name, speaker, language_id, avatar_id FROM avatar_mapping WHERE language_id = ?) as avatar_mapping
RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id
WHERE a.link != '[object Object]'
ORDER BY a.id
    `, [id]);
})

const get_speakers = cache(async (id) => {
    return await query_objs(`SELECT * FROM speaker WHERE language_id = ?`, [id]);
})

const get_language = cache(async (id) => {
    const isNumeric = value => value.length !== 0 && [...value].every(c => c >= '0' && c <= '9');
    if(isNumeric(id)) {
        return [(await query_one_obj(`SELECT * FROM language WHERE id = ? LIMIT 1`, [id])), undefined];
    }
    else {
        let course = await query_one_obj(`SELECT learningLanguage, short FROM course WHERE short = ? LIMIT 1`, [id]);
        if(course) {
            id = course.learningLanguage;
            return [(await query_one_obj(`SELECT * FROM language WHERE id = ? LIMIT 1`, [id])), course];
        }
        return [(await query_one_obj(`SELECT * FROM language WHERE short = ? LIMIT 1`, [id])), undefined];
    }
})

export default async function Page({params}) {
    const session = await getServerSession(authOptions);

    let [language, course] = await get_language(params.language);
    console.log("langu")
    console.log(language)
    console.log("course")
    console.log(course)

    if(!language) {
        notFound();
    }

    let speakers = await get_speakers(language.id);
    let avatar_names = await get_avatar_names(language.id);

    // Render data...
    return <>
        <LanguageEditor language={language} speakers={speakers} avatar_names={avatar_names} session={session} course={course}/>
    </>
}
