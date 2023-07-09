import {getToken} from "next-auth/jwt";
import {update_query} from "../../../../lib/query_variants";

export default async function api(req, res) {
    try {
        const {id, tts_replace } = req.body;
        const token = await getToken({ req })

        if(!token?.role)
            return res.status(401).json("You need to be a registered contributor.");

        let answer = await set_avatar({id, tts_replace});

        if(answer === undefined)
            return res.status(404).test("Error not found");

        return res.json(answer);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function set_avatar({id, tts_replace}) {
    return await update_query("language", {id, tts_replace}, ["tts_replace"]);
}