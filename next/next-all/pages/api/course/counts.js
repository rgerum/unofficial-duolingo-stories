import query from "../../../lib/db"

export default async function counts(req, res) {
    let answer = await get_counts();
    return res.status(200).json(answer);
}

export async function get_counts() {
    let res = await query(`SELECT COUNT(DISTINCT course.id) AS count_courses, COUNT(DISTINCT story.id) as count_stories FROM course
LEFT JOIN language l1 ON l1.id = course.fromLanguage
LEFT JOIN language l2 ON l2.id = course.learningLanguage
LEFT JOIN story ON (course.id = story.course_id)
WHERE story.public = 1 AND story.deleted = 0 AND course.public = 1`);
    return Object.assign({}, res[0]);
}