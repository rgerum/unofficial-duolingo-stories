import {getToken} from "next-auth/jwt";
import {audio_engines} from "../../../lib/audio";
import query from  "../../../lib/db";

export default async function api(req, res) {
    try {
        const token = await getToken({ req })

        if(!token?.admin)
            return res.status(401).json("You need to be a registered admin.");

        let voices = [];
        for(let engine of audio_engines)
            voices = voices.concat(await engine.getVoices());

        for(let v of voices) {
            try {
                await query(`
            REPLACE INTO speaker (language_id, speaker, gender, type, service)
             VALUES ((SELECT id FROM language WHERE short = ?), ?, ?, ?, ?)`,
                    [v.language, v.name, v.gender, v.type, v.service]);
            }
            catch (e) {
                console.log("unknown language", v.language);
            }
        }

        return res.json(voices);
    }
    catch (err) {
        res.status(500).json({ message: err.message, body: req.body });
    }
}
