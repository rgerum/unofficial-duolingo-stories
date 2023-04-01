import {getToken} from "next-auth/jwt";
import query from  "../../../../lib/db";
import {update_query, insert_query} from "../../../../lib/query_variants";

async function query_obj(q, args) {
    let res = await query(q, args);
    return res.map(d => {return {...d}});
}

export async function get_story({id}) {
    let story = (await query_obj(`SELECT story.id, c.official as official, course_id, duo_id, image, story.name, set_id, set_index, text, c.learningLanguage as learningLanguage, c.fromLanguage as fromLanguage FROM story JOIN course c on story.course_id = c.id WHERE story.id = ?`, [id]))[0]
    if(story === undefined)
        return null
    return story;
}

async function get_avatar_names({id, course_id}) {
    if(id === 0) {
        return await query_obj(`SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker FROM avatar_mapping RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id WHERE (language_id = (SELECT learningLanguage FROM course WHERE id = ?) or language_id is NULL) ORDER BY a.id`, [course_id]);
    }
    else {
        return await query_obj(`SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker FROM (SELECT * FROM avatar_mapping WHERE language_id = ?) as avatar_mapping RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id ORDER BY a.id`, [id]);
    }
}

export async function getAvatarsList(id) {
    if (!id)
        return {}
    let avatar_names_list = await get_avatar_names({id});
    let avatar_names = {}
    for (let avatar of avatar_names_list) {
        avatar_names[avatar.avatar_id] = avatar;
    }
    return avatar_names;
}