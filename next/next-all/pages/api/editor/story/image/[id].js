import {getToken} from "next-auth/jwt";
import query from  "../../../../../lib/db";
import {update_query, insert_query} from "../../../../../lib/query_variants";

export default async function api(req, res) {
    try {
        const {id} = req.params;
        const token = await getToken({ req })

        if(!token?.role)
            return res.status(401).json("You need to be a registered contributor.");

        let answer = await get_image({id});

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


export async function get_image({id}) {
    return (await query_obj(`SELECT * FROM image WHERE id = ?`, [id]))[0];
}