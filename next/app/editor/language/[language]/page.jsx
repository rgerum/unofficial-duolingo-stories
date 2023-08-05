import React from "react";
import { cache } from 'react'
import {query_objs, query_one_obj} from "lib/db"
import LanguageEditor from "./language_editor";
import {getServerSession} from "next-auth/next";

import {authOptions} from "app/api/auth/[...nextauth]/route";


const get_avatar_names = cache(async (id) => {
    const isNumeric = value => value.length !== 0 && [...value].every(c => c >= '0' && c <= '9');
    if(!isNumeric(id)) {
        id = (await query_one_obj(`SELECT id FROM language WHERE short = ? LIMIT 1`, [id])).id;
    }

    return await query_objs(`
SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker
FROM (SELECT id, name, speaker, language_id, avatar_id FROM avatar_mapping WHERE language_id = ?) as avatar_mapping
RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id
WHERE a.link != '[object Object]'
ORDER BY a.id
    `, [id]);
})

const get_speakers = cache(async (id) => {
    const isNumeric = value => value.length !== 0 && [...value].every(c => c >= '0' && c <= '9');
    if(!isNumeric(id)) {
        id = (await query_one_obj(`SELECT id FROM language WHERE short = ? LIMIT 1`, [id])).id;
    }

    return await query_objs(`SELECT * FROM speaker WHERE language_id = ?`, [id]);
})

const get_language = cache(async (id) => {
    const isNumeric = value => value.length !== 0 && [...value].every(c => c >= '0' && c <= '9');
    if(isNumeric(id)) {
        return (await query_one_obj(`SELECT * FROM language WHERE id = ? LIMIT 1`, [id]));
    }
    else {
        return (await query_one_obj(`SELECT * FROM language WHERE short = ? LIMIT 1`, [id]));
    }
})

export default async function Page({params}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return {redirect: {destination: '/editor/login', permanent: false,},};
    }
    if (!session.user.role) {
        return {redirect: {destination: '/editor/not_allowed', permanent: false,},};
    }

    let language = await get_language(params.language);

    if(!language) {
        return {
            notFound: true,
        }
    }

    let speakers = await get_speakers(params.language);
    let avatar_names = await get_avatar_names(params.language);

    // Render data...
    return <>
        <LanguageEditor language={language} speakers={speakers} avatar_names={avatar_names} session={session}/>
    </>
}
