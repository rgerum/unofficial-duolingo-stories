import query from "../../../lib/db"
import {getToken} from "next-auth/jwt";

export default async (req, res) => {
    const token = await getToken({ req })
    let answer = await get_user_stories_done(token.id);
    return res.status(200).json(answer);
}

async function get_user_stories_done(user_id) {
    console.log("get_user_stories_done", user_id)
    const stories_done = await query(`SELECT story_id FROM story_done WHERE user_id = ? GROUP BY id`, [user_id]);
    let done = [];
    for (let story_done of stories_done) {
        done.push(story_done.story_id)
    }
    return done;
}