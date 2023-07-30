import query, {update} from "lib/db"
import {getToken} from "next-auth/jwt";
import {NextResponse} from "next/server";


export async function GET(req, {params: {story_id}}) {
    try {
        const token = await getToken({ req })

        if(!token.role)
            return new Response("Error not allowed", {status: 401});

        let answer = await set_approve({story_id: parseInt(story_id), user_id: token?.id});

        if(answer === undefined)
            return new Response("Error not found", {status: 404});

        return NextResponse.json(answer);
    }
    catch (err) {
        return new Response(err.message, {status: 500});
    }
}

export async function updateX(table_name, data) {
    let values = [];
    let updates = [];
    for(let key in data) {
        values.push(data[key]);
        updates.push(`${key} = ?`);
    }
    values.push(data.id);
    let update_string = updates.join(", ");
    return await query(`UPDATE ${table_name}
                        SET ${update_string}
                        WHERE id = ?;`, values);
}

async function set_status(data) {
    return await update("story", data, ["status"]);
}

async function set_approve({story_id, user_id}) {
    let res = await query(`SELECT id FROM story_approval WHERE story_id = ? AND user_id = ?;`, [story_id, user_id]);
    let action;
    if(res.length) {
        await query(`DELETE FROM story_approval WHERE story_id = ? AND user_id = ?;`, [story_id, user_id]);
        action = "deleted";
    }
    else {
        await query(`INSERT INTO story_approval (story_id, user_id) VALUES (?, ?);`, [story_id, user_id]);
        action = 'added';
    }
    let res2 = (await query(`SELECT COUNT(id) as count FROM story_approval WHERE story_id = ?;`, [story_id]))[0];
    let count = res2["count"];

    let status = undefined;
    if(count === 0)
        status = "draft"
    if(count === 1)
        status = "feedback"
    if(count >= 2)
        status = "finished"

    await set_status({status: status, id: story_id});

    // get the number of finished stories in this set
    let res3 = await query(`SELECT story.id, story.public FROM story WHERE set_id = (SELECT set_id FROM story WHERE id = ?) AND
                                            course_id = (SELECT course_id FROM story WHERE id = ?) AND status = 'finished' AND deleted = 0;`, [story_id, story_id]);

    let published = []
    if(res3.length >= 4) {
        let date_published = (new Date()).toISOString();
        for(let story of res3) {
            if(story.public === 0) {
                await query(`UPDATE story SET public = 1, date_published = ? WHERE id = ?;`, [date_published, story.id]);
                published.push(story.id);
            }
        }
    }

    return {count: count, story_status: status, finished_in_set: res3.length, action: action, published: published};
}