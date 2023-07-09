import query from  "../../../lib/db";
import {getToken} from "next-auth/jwt";
import {update} from  "../../../lib/db";

export default async function api(req, res) {
    try {
        const token = await getToken({ req })

        if(!token?.admin)
            return res.status(401).json("You need to be a registered admin.");

        let answer;
        if(req.body.approval_id) {
            answer = await remove_approval(req.body, {username: token.name, user_id: token.id});
        }
        else
            answer = await set_story(req.body, {username: token.name, user_id: token.id});

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

export async function story_properties(id) {
    let data = (await query_obj(`SELECT story.id, story.name, story.image, story.public, course.short FROM story JOIN course ON course.id = story.course_id WHERE story.id = ?;`, [parseInt(id)]));
    if(data.length === 0)
        return undefined
    let story = data[0];
    story.approvals = await query_obj(`SELECT a.id, a.date, u.username FROM story_approval a JOIN user u ON u.id = a.user_id WHERE a.story_id = ?`, [id]);
    return story
}

async function set_story(data) {
    console.log(data)
    let res = await update('story', data, ["public"]);
    console.log("get", res, data)
    let answer = await story_properties(data.id);
    console.log("get", res, data.id, answer)
    return answer;
}

async function remove_approval(data) {
    console.log(data)
    let res = await query(`DELETE FROM story_approval WHERE id = ?;`, [data.approval_id]);
    console.log("get", res, data)
    let answer = await story_properties(data.id);
    console.log("get", res, data.id, answer)
    return answer;
}