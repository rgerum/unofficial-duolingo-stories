import {insert, update} from "lib/db";
import {getToken} from "next-auth/jwt";
import {NextResponse} from "next/server";

export async function POST(req) {
    try {
        const data = await req.json();
        const token = await getToken({ req })

        if(!token?.admin)
            return new Response('You need to be a registered admin.', {status: 401})

        let answer = await set_language(data, {username: token.name, user_id: token.id});

        if(answer === undefined)
            return new Response('Error not found.', {status: 404})

        return NextResponse.json(answer);
    }
    catch (err) {
        return new Response(err.message, {status: 500})
    }
}

async function set_language(data) {
    if(data.id === undefined)
        return await insert('language', data)
    return await update('language', data, ["name", "short", "flag", "flag_file", "rtl", "speaker"]);
}