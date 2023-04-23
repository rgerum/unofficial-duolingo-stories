import query from  "../../../lib/db";
import {insert_query, update_query} from "../../../lib/query_variants";
import {getToken} from "next-auth/jwt";

export default async function api(req, res) {
    try {
        const token = await getToken({ req })

        if(!token?.admin)
            return res.status(401).json("You need to be a registered admin.");

        let answer = await set_user_activate(req.body, {username: token.name, user_id: token.id});

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

export async function user_list() {
    return await query_obj(`SELECT user.id, user.username, user.role, user.email, DATE_FORMAT(user.regdate,'%d-%m-%Y %H:%i:%s') AS regdate, user.activated, user.admin, COUNT(story.id) count FROM user LEFT JOIN story ON story.author = user.id GROUP BY user.id;`);
}


async function set_user_activate({id, activated}) {
    return await query(`UPDATE user SET activated = ? WHERE user.id = ?;`, [activated, id]);
}

async function set_user_write({id, write}) {
    return await query_obj(`UPDATE user SET role = ? WHERE user.id = ?;`, [write, id]);
}
