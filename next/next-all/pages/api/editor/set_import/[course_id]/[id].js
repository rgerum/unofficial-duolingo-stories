import query from "../../../../../lib/db"
import {getToken} from "next-auth/jwt";
import {insert_query} from "../../../../../lib/query_variants";
import {upload_github} from "../../../../../lib/editor/upload_github";


export default async function api(req, res) {
    try {
        const token = await getToken({ req });

        if(!token?.role)
            return res.status(401).json("You need to be a registered contributor.");

        let answer = await set_import({id: req.query.id, course_id: req.query.course_id},
            {user_id: token?.id, username: token?.name});

        if (answer === undefined)
            return res.status(404).test("Error not found");

        return res.json(answer);
    }
    catch (err) {

        res.status(500).json({ message: err.message });
    }
}

async function set_import({id, course_id}, {user_id, username}) {
    let data = (await query(`SELECT duo_id, name, image, set_id, set_index, text, json FROM story WHERE id = ?;`, [id]))[0];

    data['author'] = user_id;
    data['course_id'] = course_id;
    data['api'] = 2;

    let new_id = await insert_query("story", data, ["duo_id", "name", "author", "image", "set_id", "set_index", "course_id", "text", "json", "api"]);

    let data2 = (await query(`SELECT text,name,course_id, id FROM story WHERE id = ?;`, [new_id]))[0];

    await upload_github(data2['id'], data2["course_id"], data2["text"], username,`added ${data["name"]} in course ${data["course_id"]}`);

    return {id: new_id}
}