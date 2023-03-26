import query from "../../../../lib/db"
import {getToken} from "next-auth/jwt";

async function query_obj(q, args) {
    let res = await query(q, args);
    return res.map(d => {return {...d}});
}

export async function get_avatar_names(id, course_id) {
    if(id === 0) {
        return await query_obj(`SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker FROM avatar_mapping RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id WHERE (language_id = (SELECT learningLanguage FROM course WHERE id = ?) or language_id is NULL) ORDER BY a.id`, [course_id]);
    }
    else {
        return await query_obj(`
SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker
FROM (SELECT id, name, speaker, language_id, avatar_id FROM avatar_mapping WHERE language_id = ?) as avatar_mapping
RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id
WHERE a.link != '[object Object]'
ORDER BY a.id
        `, [id]);
    }
}

export async function get_speakers(id) {
    return await query_obj(`SELECT * FROM speaker WHERE language_id = ?`, [id]);
}

export async function get_language(id) {
    return (await query_obj(`SELECT * FROM language WHERE id = ? LIMIT 1`, [id]))[0];
}

export async function get_languages() {
    return await query_obj(`SELECT id FROM language`);
}