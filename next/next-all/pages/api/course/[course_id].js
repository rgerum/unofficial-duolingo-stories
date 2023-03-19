import query from "../../../lib/db"

export default async function course(req, res) {
    const { course_id } = req.query
    const user_id = undefined;

    let answer = await get_course(course_id, user_id);

    if(answer === undefined)
        return res.status(404).test("Error not found");

    return res.json(answer);
}

export async function get_course(course_id, user_id) {

    const course_query = await query(`
        SELECT course.id, course.short, course.about, 
        l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
        l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag     
        FROM course 
        LEFT JOIN language l1 ON l1.id = course.fromLanguage
        LEFT JOIN language l2 ON l2.id = course.learningLanguage
        WHERE course.short = ? LIMIT 1
        `, [course_id]);

    if(course_query.length === 0)
        return undefined;
    const course = Object.assign({}, course_query[0]);

    const res = await query(`
        SELECT story.id, story.set_id, story.set_index, story.name, story_done.time as time,
        i.active, i.activeLip, i.gilded, i.gildedLip
        FROM story
        LEFT JOIN story_done ON story_done.story_id = story.id AND story_done.user_id = ?
        JOIN image i on story.image = i.id
        WHERE story.public = 1 AND story.deleted = 0 AND story.course_id = (SELECT c.id FROM course c WHERE c.short = ?)
        GROUP BY story.id
        ORDER BY set_id, set_index;
        `, [user_id, course_id]);
    if(res.length === 0)
        return undefined;

    // group into sets
    let set = -1;
    let sets = [];
    for(let d of res) {
        if (set !== d.set_id) {
            set = d.set_id;
            sets.push([]);
        }
        sets[sets.length - 1].push(Object.assign({}, d));
    }

    let count = 0;
    for(let set of sets)
        count += set.length;

    return {...course, sets: sets, count: count};
}