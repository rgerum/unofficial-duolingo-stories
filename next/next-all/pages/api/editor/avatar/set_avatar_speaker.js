import {getToken} from "next-auth/jwt";
import query from  "../../../../lib/db";
import {update_query, insert_query} from "../../../../lib/query_variants";

export default async function api(req, res) {
    try {
        const {id, name, speaker, language_id, avatar_id } = req.body;
        const token = await getToken({ req })

        if(!token?.role)
            return res.status(401).json("You need to be a registered contributor.");

        let answer = await set_avatar({id, name, speaker, language_id, avatar_id});

        if(answer === undefined)
            return res.status(404).test("Error not found");

        return res.json(answer);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function set_avatar({id, name, speaker, language_id, avatar_id}) {
    let res = await query(`SELECT id FROM avatar_mapping WHERE language_id = ? AND avatar_id = ?;`, [language_id, avatar_id]);

    if(res.length) {
        id = res[0].id;
        return await update_query("avatar_mapping", {id, name, speaker, language_id, avatar_id}, ["name", "speaker", "language_id", "avatar_id"]);
    }
    return await insert_query("avatar_mapping", {id, name, speaker, language_id, avatar_id}, ["name", "speaker", "language_id", "avatar_id"]);
}