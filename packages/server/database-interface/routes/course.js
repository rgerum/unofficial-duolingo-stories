const express = require('express')
const query = require("./../includes/db.js");
const {func_catch} = require("./../includes/includes.js");

let router = express.Router();

async function get_counts() {
    let res = await query(`SELECT COUNT(DISTINCT course.id) AS count_courses, COUNT(DISTINCT story.id) as count_stories FROM course
LEFT JOIN language l1 ON l1.id = course.fromLanguage
LEFT JOIN language l2 ON l2.id = course.learningLanguage
LEFT JOIN story ON (course.id = story.course_id)
WHERE story.public = 1 AND story.deleted = 0 AND course.public = 1`);
    return res[0];
}

async function get_story({story_id}) {
    let res = await query(`SELECT l1.short AS fromLanguage, l2.short AS learningLanguage, 
              l1.name AS fromLanguageLong, l2.name AS learningLanguageLong, 
              l1.rtl AS fromLanguageRTL, l2.rtl AS learningLanguageRTL,
              story.id, story.json 
              FROM story 
              JOIN course c on story.course_id = c.id 
              LEFT JOIN language l1 ON l1.id = c.fromLanguage
              LEFT JOIN language l2 ON l2.id = c.learningLanguage 
              WHERE story.id = ?;`, story_id);
    if (res.length === 0) {
        //result.sendStatus(404);
        return
    }
    let data = JSON.parse(res[0]["json"]);
    data.id = res[0]["id"];

    data.fromLanguage = res[0]["fromLanguage"];
    data.fromLanguageLong = res[0]["fromLanguageLong"];
    data.fromLanguageRTL = res[0]["fromLanguageRTL"];

    data.learningLanguage = res[0]["learningLanguage"];
    data.learningLanguageLong = res[0]["learningLanguageLong"];
    data.learningLanguageRTL = res[0]["learningLanguageRTL"];

    return data;
}

async function get_courses() {
    let courses = await query(`
SELECT course.id,  COALESCE(NULLIF(course.name, ''), l2.name) as name,
 l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
 l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag,
 COUNT(story.id) count, course.public, course.official, course.conlang FROM course
LEFT JOIN language l1 ON l1.id = course.fromLanguage
LEFT JOIN language l2 ON l2.id = course.learningLanguage
LEFT JOIN story ON (course.id = story.course_id)
WHERE story.public = 1 AND story.deleted = 0 AND course.public = 1
GROUP BY course.id
ORDER BY name;
    `);
    // sort courses by base language
    let base_languages = {};
    let languages = [];
    // iterate over all courses
    for (let course of courses) {
        // if base language not yet in list
        if (base_languages[course.fromLanguageName] === undefined) {
            // initialize the list
            base_languages[course.fromLanguageName] = [];
            // and add it to the list of all base languages (we will add English after sorting in the front)
            if (course.fromLanguageName !== "English")
                languages.push(course.fromLanguageName);
        }
        base_languages[course.fromLanguageName].push(course)
    }
    // sort the base languages and then add English as first (and most relevant)
    languages = languages.sort();
    // if we have english courses add "English" as the first entry
    if (base_languages["English"])
        languages.unshift("English");

    // create a new sorted
    let grouped_languages = {};
    for (let lang of languages) {
        grouped_languages[lang] = base_languages[lang];
    }

    return grouped_languages;
}

async function get_courses_user({}, {user_id}) {
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

async function post_story_done({story_id}, {user_id}) {
    if(!user_id) {
        await query(`INSERT INTO story_done (story_id) VALUES(?)`, [parseInt(story_id)]);
        return {status: 'done'}
    }
    await query(`INSERT INTO story_done (user_id, story_id) VALUES(?, ?)`, [user_id, parseInt(story_id)]);
    return {message: "done"}
}

async function get_user_stories_done({course_id}, {user_id}) {
    const stories_done = await query(`SELECT story_id FROM story_done WHERE user_id = ? GROUP BY id`, [user_id]);
    let done = [];
    for (let story_done of stories_done) {
        done.push(story_done.story_id)
    }
    return done;
}

async function get_course({lang, lang_base}, {user_id}) {
    const course_query = await query(`
        SELECT course.id, course.about, 
        l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
        l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag     
        FROM course 
        LEFT JOIN language l1 ON l1.id = course.fromLanguage
        LEFT JOIN language l2 ON l2.id = course.learningLanguage
        WHERE course.short = ? LIMIT 1
        `, [lang+"-"+lang_base]);
    if(course_query.length === 0)
        return {status: 404};
    const course = course_query[0];

    const res = await query(`
        SELECT story.id, story.set_id, story.set_index, story.name, story_done.time as time,
        i.active, i.activeLip, i.gilded, i.gildedLip
        FROM story
        LEFT JOIN story_done ON story_done.story_id = story.id AND story_done.user_id = ?
        JOIN image i on story.image = i.id
        WHERE story.public = 1 AND story.deleted = 0 AND story.course_id = (SELECT c.id FROM course c WHERE c.short = ?)
        GROUP BY story.id
        ORDER BY set_id, set_index;
        `, [user_id, lang+"-"+lang_base]);
    if(res.length === 0)
        return {status: 404};

    // group into sets
    let set = -1;
    let sets = [];
    for(let d of res) {
        if (set !== d.set_id) {
            set = d.set_id;
            sets.push([]);
        }
        sets[sets.length - 1].push(d);
    }

    let count = 0;
    for(let set of sets)
        count += set.length;

    return {...course, sets: sets, count: count};
}

router.get('/story/:story_id', func_catch(get_story));
router.get('/story/:story_id/done', func_catch(post_story_done));
router.get('/course_counts', func_catch(get_counts));
router.get('/courses', func_catch(get_courses));
router.get('/courses_user', func_catch(get_courses_user));
router.get('/course/:lang-:lang_base', func_catch(get_course));
router.get('/user_stories_done', func_catch(get_user_stories_done));

module.exports = router;
