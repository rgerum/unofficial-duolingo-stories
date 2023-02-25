import query from "../../../../lib/db"
import {getToken} from "next-auth/jwt";


export default async function story_done(req, res) {
    try {
        const token = await getToken({ req })
        let answer = await post_story_done({story_id: req.query.story_id, user_id: token?.id});

        if (answer === undefined)
            return res.status(404).test("Error not found");

        return res.json(answer);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function post_story_done({story_id, user_id}) {
    if(!user_id) {
        await query(`INSERT INTO story_done (story_id) VALUES(?)`, [parseInt(story_id)]);
        return {status: 'done'}
    }
    await query(`INSERT INTO story_done (user_id, story_id) VALUES(?, ?)`, [user_id, parseInt(story_id)]);
    return {message: "done"}
}