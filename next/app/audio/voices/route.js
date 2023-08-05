import {NextResponse} from "next/server";
import {getToken} from "next-auth/jwt";
import {audio_engines} from "../_lib/audio";
import query from  "lib/db";


export async function GET(req) {
    try {
        const token = await getToken({ req })

        if(!token?.admin)
            return new Response('You need to be a registered admin.', {status: 401})

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

        return NextResponse.json(voices);
    }
    catch (err) {
        return new Response(err.message, {status: 500})
    }
}
