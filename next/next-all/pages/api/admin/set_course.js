import query from  "../../../lib/db";
import {insert_query, update_query} from "../../../lib/query_variants";
import {getToken} from "next-auth/jwt";

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
    return await query_obj(`SELECT * FROM course;`);
}

async function set_course(data, revalidate) {
    if(data["official"] === undefined)
        data["official"] = 0;
    let id = undefined;
    if(data.id === undefined) {
        id = await insert_query('course', data);
    }
    else {
        let res = await update_query('course', data, ["learningLanguage", "fromLanguage", "public", "name", "official", "conlang", "about"]);
        id = data["id"];
    }
    let result = await query(`UPDATE course JOIN language l on l.id = course.fromLanguage JOIN language l2 on l2.id = course.learningLanguage
                       SET course.short = CONCAT(l2.short, "-", l.short)
                       WHERE course.id = ?;`, [id]);
    // revalidate the page
    let response_course_id = await query(`SELECT short FROM course WHERE course.id = ?`, [id]);
    console.log(`revalidate /${response_course_id[0].short}`)
    await revalidate(`/${response_course_id[0].short}`);
    await revalidate(`/`);
    return result;
}
