import query from  "../../../lib/db";
import {insert_query, update_query} from "../../../lib/query_variants";
import {getToken} from "next-auth/jwt";
import { revalidatePath } from 'next/cache';

export default async function api(req, res) {
    try {
        const token = await getToken({ req })

        if(!token?.admin)
            return res.status(401).json("You need to be a registered admin.");

        let answer = await set_course(req.body, {username: token.name, user_id: token.id}, res.revalidate);

        if(answer === undefined)
            return res.status(404).test("Error not found");

        return res.json(answer);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function query_obj(q, args) {
    let res = await query(q, args);
    return res.map(d => {return {...d}});
}

export async function course_list() {
    return await query_obj(`SELECT
    course.id,
    course.learningLanguage,
    course.fromLanguage,
    course.public,
    course.official,
    course.name,
    course.about,
    course.conlang,
    course.short,
    (
        SELECT GROUP_CONCAT(course_tag.name, ',')
        FROM course_tag_map
        LEFT JOIN course_tag ON course_tag.id = course_tag_map.course_tag_id
        WHERE course.id = course_tag_map.course_id
    ) AS tag_list
FROM course;
`);
}

export async function course_tag_list() {
    return await query_obj(`SELECT * FROM course_tag;`);
}


async function set_course(data) {
    if(data["official"] === undefined)
        data["official"] = 0;
    let id;
    let tag_list = data["tag_list"];
    delete data["tag_list"];
    if(data.id === undefined) {
        id = await insert_query('course', data);
    }
    else {
        await update_query('course', data, ["learningLanguage", "fromLanguage", "public", "name", "official", "conlang", "about"]);
        id = data["id"];
    }
    // update the tags
    let tags= tag_list.split(",").map(d => d.trim());
    let current_tags = await query(`SELECT *, ctm.id as map_id FROM course_tag JOIN course_tag_map ctm on course_tag.id = ctm.course_tag_id WHERE course_id = ?;`, [id]);
    let all_tags = (await query(`SELECT name FROM course_tag;`)).map(d => d.name);

    for(let tag_entry of current_tags) {
        if(!tags.includes(tag_entry.name)) {
            await query(`DELETE FROM course_tag_map WHERE id = ?;`, [tag_entry.map_id]);
        }
        else
            tags = tags.filter(x => x !== tag_entry.name);
    }
    for(let tag of tags) {
        if(!all_tags.includes(tag)) {
            await query(`INSERT INTO course_tag (name) VALUES (?);`, [tag]);
        }
        await query(`INSERT INTO course_tag_map (course_id, course_tag_id) VALUES (?, (SELECT id FROM course_tag WHERE name = ?) );`, [id, tag]);
    }

    let result = await query(`UPDATE course JOIN language l on l.id = course.fromLanguage JOIN language l2 on l2.id = course.learningLanguage
                       SET course.short = CONCAT(l2.short, "-", l.short)
                       WHERE course.id = ?;`, [id]);
    // revalidate the page
    let response_course_id = await query(`SELECT short FROM course WHERE course.id = ?`, [id]);
    try {
        revalidatePath(`/${response_course_id[0].short}`);
        revalidatePath(`/`);
    }
    catch (e) {
        console.log("revalidate error", e)
    }
    return result;
}
