import {getToken} from "next-auth/jwt";
import query from  "../../../../lib/db";
import {update_query, insert_query} from "../../../../lib/query_variants";
import {upload_github} from "../../../../lib/editor/upload_github";

export default async function api(req, res) {
    try {
        const token = await getToken({ req })

        if(!token?.role)
            return res.status(401).json("You need to be a registered contributor.");

        let answer = await delete_story(req.body, {username: token.name, user_id: token.id});

        if(answer === undefined)
            return res.status(404).test("Error not found");

        return res.json(answer);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function delete_story({id}, {username}) {
    await query(`UPDATE story SET deleted = 1, public = 0 WHERE id = ?;`, [id]);
    let data = (await query(`SELECT * FROM story WHERE id = ?;`, [id]))[0];
    await upload_github(data['id'], data["course_id"], data["text"], username, `delete ${data["name"]} from course ${data["course_id"]}`, true);
    return "done"
}
