const express = require('express')
const query = require("./db.js");

let router = express.Router();

function func_catch(func) {
    return async (req, res) => {
        try {
            let data = await func({...req.params, ...req.session});
            if(data?.status) {
                return res.status(data.status).json(data);
            }
            else if(data === undefined) {
                return res.status(404).json({});
            }
            else
                res.json(data);
        }
        catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}

async function get_story({story_id}) {
    let res = await query(`SELECT l1.short AS fromLanguage, l2.short AS learningLanguage, story.id, story.json 
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
    data.learningLanguage = res[0]["learningLanguage"];

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
WHERE story.public = 1
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

async function post_story_done({user_id, story_id}) {
    if(!user_id) {
        return {status: 403}
    }
    await query(`INSERT INTO story_done (user_id, story_id) VALUES(?, ?)`, [user_id, story_id]);
    return {message: "done"}
}

async function get_course({user_id, lang, lang_base}) {
    let res = await query(`
        SELECT story.id, story.set_id, story.set_index, story.name, story_done.time as time,
        i.active, i.activeLip, i.gilded, i.gildedLip
        FROM story
        LEFT JOIN story_done ON story_done.story_id = story.id AND story_done.user_id = ?
        JOIN image i on story.image = i.id
        WHERE story.public = 1 AND story.course_id = (SELECT c.id FROM course c WHERE c.short = ?)
        GROUP BY story.id
        ORDER BY set_id, set_index;
        `, [user_id, lang+"-"+lang_base]);
    if(res.length === 0)
        return;

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

    return sets;
}

router.get('/story/:story_id', func_catch(get_story));
router.get('/story/:story_id/done', func_catch(post_story_done));
router.get('/courses', func_catch(get_courses));
router.get('/course/:lang-:lang_base', func_catch(get_course));

module.exports = router;
