import query from "../../../lib/db"
import {getToken} from "next-auth/jwt";

export default async (req, res) => {
    const token = await getToken({ req })
    let answer = await get_courses_user(token.id);
    return res.status(200).json(answer);
}

async function get_courses_user(user_id) {
    // sort courses by base language
    return await query(`
SELECT course.id, course.name,
 l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
 l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag,
 course.public, course.official, time FROM course
LEFT JOIN language l1 ON l1.id = course.fromLanguage
LEFT JOIN language l2 ON l2.id = course.learningLanguage
    INNER JOIN (SELECT s.course_id, story_done.id as sdid, MAX(story_done.time) as time FROM story s INNER JOIN story_done ON story_done.story_id = s.id WHERE story_done.user_id = ? GROUP BY course_id) as ss on course.id = ss.course_id
     ORDER BY time DESC
    `, [user_id]);
}
