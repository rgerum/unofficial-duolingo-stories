import query from  "../../../lib/db";
import {insert_query, update_query} from "../../../lib/query_variants";
import {getToken} from "next-auth/jwt";

export default async function api(req, res) {
    try {
        const token = await getToken({ req })

        if(!token?.admin)
            return res.status(401).json("You need to be a registered admin.");

        let answer = await set_language(req.body, {username: token.name, user_id: token.id});

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

export async function language_list() {
    return await query_obj(`SELECT * FROM language;`);
}

async function course_list() {
    return await query_obj(`SELECT * FROM course;`);
}

async function set_language(data) {
    if(data.id === undefined)
        return await insert_query('language', data)
    return await update_query('language', data, ["name", "short", "flag", "flag_file", "rtl", "speaker"]);
}