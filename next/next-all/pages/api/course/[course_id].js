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
        return {...course, sets: [], count: 0};

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

export async function get_course_editor(course_id) {
    const isNumeric = value => value.length !== 0 && [...value].every(c => c >= '0' && c <= '9');
    let course_query;
    if(isNumeric(course_id)) {
        course_query = await query(`
        SELECT course.id, course.short, course.about, course.official,
        l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
        l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag     
        FROM course 
        LEFT JOIN language l1 ON l1.id = course.fromLanguage
        LEFT JOIN language l2 ON l2.id = course.learningLanguage
        WHERE course.id = ? LIMIT 1
        `, [course_id]);

        if (course_query.length === 0)
            return undefined;
    }
    else {
        course_query = await query(`
        SELECT course.id, course.short, course.about, course.official,
        l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
        l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag     
        FROM course 
        LEFT JOIN language l1 ON l1.id = course.fromLanguage
        LEFT JOIN language l2 ON l2.id = course.learningLanguage
        WHERE course.short = ? LIMIT 1
        `, [course_id]);

        if (course_query.length === 0)
            return undefined;
    }
    const course = Object.assign({}, course_query[0]);

    const res = await query(`SELECT COUNT(sa.id) as approvals, story.id, story.set_id, story.set_index, story.name, story.status, story.image,
       story.image_done, story.xp, story.name_base, user.username, user2.username AS author_change, story.date, story.change_date, story.public
    FROM story
    LEFT JOIN user ON story.author = user.id
    LEFT JOIN user user2 ON story.author_change = user2.id
    LEFT JOIN story_approval sa on story.id = sa.story_id
    WHERE story.course_id = ? AND deleted = false
    GROUP BY story.id
    ORDER BY story.set_id, story.set_index;`, [course.id]);
    //if(res.length === 0)
    //    return {error: "no stories"};

    let stories = [];
    for(let r of res) {
        r = {...r};
        r.date = `${r.date}`;
        r.change_date = `${r.change_date}`;
        stories.push(r);
    }

    let res2 = await query(`SELECT c.short, u.id, u.username, MAX(sa.date) as last_date FROM course c JOIN story s on c.id = s.course_id JOIN story_approval sa on s.id = sa.story_id JOIN user u on u.id = sa.user_id WHERE course_id = ? GROUP BY user_id, c.id ORDER BY last_date DESC`, [course.id])

    let contributors = [];
    for(let r of res2) {
        r = {...r};
        r.last_date = `${r.last_date}`;
        contributors.push(r);
    }

    return {...course, stories: stories, contributors: contributors};
}
