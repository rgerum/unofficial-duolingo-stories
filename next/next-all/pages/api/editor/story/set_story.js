import {getToken} from "next-auth/jwt";
import query from  "../../../../lib/db";
import {update_query, insert_query} from "../../../../lib/query_variants";
import {upload_github} from "../../../../lib/editor/upload_github";

export default async function api(req, res) {
    try {
        const token = await getToken({ req })

        if(!token?.role)
            return res.status(401).json("You need to be a registered contributor.");

        let answer = await set_story(req.body, {username: token.name, user_id: token.id});

        if(answer === undefined)
            return res.status(404).test("Error not found");

        return res.json(answer);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function set_story(data, {username, user_id}) {
    data["api"] = 2;
    data["change_date"] = (new Date()).toISOString();
    data["author_change"] = user_id;

    // if no id is given we look for a
    if(data["id"] === undefined) {
        let res = await query(`SELECT id FROM story WHERE API = 2 AND duo_id = ? AND course_id = ? LIMIT 1;`, [data["duo_id"], data["course_id"]]);
        if(res.length)
            data["id"] = res[0]["id"];
    }

    await update_query("story", data, ["duo_id", "name", "image", "change_date", "author_change", "set_id", "set_index", "course_id", "text", "json", "api"]);

    await upload_github(data['id'], data["course_id"], data["text"], username,`updated ${data["name"]} in course ${data["course_id"]}`);
    return "done"
}
