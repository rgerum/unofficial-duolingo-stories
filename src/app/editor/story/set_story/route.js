import {NextResponse} from "next/server";
import {getToken} from "next-auth/jwt";
import query, {update} from  "lib/db";
import {upload_github} from "lib/editor/upload_github";


export async function POST(req) {
    try {
        const token = await getToken({ req })

        if(!token?.role)
            return new Response('You need to be a registered contributor.', {status: 401})

        let answer = await set_story(await req.json(), {username: token.name, user_id: token.id});

        if(answer === undefined)
            return new Response('Error not found.', {status: 404})

        return NextResponse.json(answer);
    }
    catch (err) {
        return new Response(err.message, {status: 500})
    }
}

async function set_story(data, {username, user_id}) {
    data["api"] = 2;
    data["change_date"] = (new Date()).toISOString();
    data["author_change"] = user_id;

    // if no id is given we look for a
    if(data["id"] === undefined) {
        let res = await query(`SELECT id FROM story WHERE API = 2 AND duo_id = ? AND course_id = ? LIMIT 1;`, [data["duo_id"], data["course_id"]]);
        if(res.length)
            data["id"] = res[0]["id"];
    }

    await update("story", data, ["duo_id", "name", "image", "change_date", "author_change", "set_id", "set_index", "course_id", "text", "json", "api"]);


    await upload_github(data['id'], data["course_id"], data["text"], username,`updated ${data["name"]} in course ${data["course_id"]}`);
    return "done"
}
