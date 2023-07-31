import {getToken} from "next-auth/jwt";
import {update} from "lib/db";
import {NextResponse} from "next/server";

export async function POST(req) {
    try {
        const {id, tts_replace } = await req.json();
        const token = await getToken({ req })

        if(!token?.role)
            return new Response('You need to be a registered contributor.', {status: 401})

        let answer = await set_avatar({id, tts_replace});

        if(answer === undefined)
            return new Response('Error not found.', {status: 404})

        return NextResponse.json(answer);
    }
    catch (err) {
        return new Response(err.message, {status: 500})
    }
}

export async function set_avatar({id, tts_replace}) {
    return await update("language", {id, tts_replace}, ["tts_replace"]);
}