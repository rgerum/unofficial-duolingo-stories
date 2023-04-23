import query from  "../../../lib/db";
import {insert_query, update_query} from "../../../lib/query_variants";
import {getToken} from "next-auth/jwt";

export default async function api(req, res) {
    try {
        const token = await getToken({ req })

        if(!token?.admin)
            return res.status(401).json("You need to be a registered admin.");

        let answer = await set_user_write(req.body, {username: token.name, user_id: token.id});

        if(answer === undefined)
            return res.status(404).test("Error not found");

        return res.json(answer);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function set_user_write({id, write}) {
    return await query(`UPDATE user SET role = ? WHERE user.id = ?;`, [write, id]);
}
