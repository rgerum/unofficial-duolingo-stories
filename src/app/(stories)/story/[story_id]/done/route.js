import query from "lib/db"
import {getToken} from "next-auth/jwt";
import { NextResponse } from 'next/server'

export async function GET(req, {params}) {
    const token = await getToken({ req })

    let answer = await post_story_done({story_id: params.story_id, user_id: token?.id});

    if (answer === undefined)
        return new Response("Error not found", {
            status: 404,
        })

    return NextResponse.json(answer);
}

async function post_story_done({story_id, user_id}) {
    if(!user_id) {
        await query(`INSERT INTO story_done (story_id) VALUES(?)`, [parseInt(story_id)]);
        return {message: 'done', story_id: story_id}
    }
    await query(`INSERT INTO story_done (user_id, story_id) VALUES(?, ?)`, [user_id, parseInt(story_id)]);
    return {message: "done", story_id:story_id, user_id: user_id}
}