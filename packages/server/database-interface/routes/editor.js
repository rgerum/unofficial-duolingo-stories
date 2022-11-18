const express = require('express');
const query = require("./../includes/db.js");
const {func_catch, update_query, insert_query} = require("./../includes/includes.js");
const {upload_github} = require("./../includes/upload_github.js");

let router = express.Router();

async function courses() {
    return await query(`SELECT course.id, course.name, l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
    l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag,
        COUNT(story.id) count, course.public, course.official FROM course
    LEFT JOIN language l1 ON l1.id = course.fromLanguage
    LEFT JOIN language l2 ON l2.id = course.learningLanguage
    LEFT JOIN story ON (story.course_id = course.id AND story.deleted = 0)
    GROUP BY course.id
    ORDER BY COUNT DESC;`);
}

async function course({course_id}) {
    let res = await query(`SELECT course.id, course.name, course.fromLanguage as fromLanguageID, l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
    course.learningLanguage as learningLanguageID, l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag,
        course.public, course.official FROM course
    LEFT JOIN language l1 ON l1.id = course.fromLanguage
    LEFT JOIN language l2 ON l2.id = course.learningLanguage
    WHERE course.id = ?;`, [course_id]);
    if (res.length === 0) {
        //result.sendStatus(404);
        return
    }
    let course = res[0];
    course["stories"] = await query(`SELECT COUNT(sa.id) as approvals, story.id, story.set_id, story.set_index, story.name, story.status, story.image,
       story.image_done, story.xp, story.name_base, user.username, user2.username AS author_change, story.date, story.change_date, story.public
    FROM story
    LEFT JOIN user ON story.author = user.id
    LEFT JOIN user user2 ON story.author_change = user2.id
    LEFT JOIN story_approval sa on story.id = sa.story_id
    WHERE story.course_id = ? AND deleted = false
    GROUP BY story.id
    ORDER BY story.set_id, story.set_index;`, [course_id]);
    return course;
}

async function avatar_names({id, course_id}) {
    if(id === 0) {
        return await query(`SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker FROM avatar_mapping RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id WHERE (language_id = (SELECT learningLanguage FROM course WHERE id = ?) or language_id is NULL) ORDER BY a.id`, [course_id]);
    }
    else {
        return await query(`SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker FROM (SELECT * FROM avatar_mapping WHERE language_id = ?) as avatar_mapping RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id ORDER BY a.id`, [id]);
    }
}

async function speakers({id}) {
    return await query(`SELECT * FROM speaker WHERE language_id = ?`, [id]);
}

async function language({id}) {
    return (await query(`SELECT * FROM language WHERE id = ?`, [id]))[0];
}

async function story({id}) {
    return (await query(`SELECT story.id, c.official as official, course_id, duo_id, image, story.name, set_id, set_index, text, c.learningLanguage as learningLanguage, c.fromLanguage as fromLanguage FROM story JOIN course c on story.course_id = c.id WHERE story.id = ?`, [id]))[0];
}

async function avatar({id}) {
    return (await query(`SELECT * FROM avatar WHERE id = ?`, [id]))[0];
}

async function image({id}) {
    return (await query(`SELECT * FROM image WHERE id = ?`, [id]))[0];
}

async function import2({id, id2}) {
    return await query(`SELECT s1.id, s1.set_id, s1.set_index, s1.name, image.gilded, image.active, COUNT(s2.id) copies
                          FROM story s1
                          LEFT JOIN (SELECT s2.duo_id, s2.id FROM story s2 WHERE s2.course_id = ?) AS s2 ON s1.duo_id = s2.duo_id
                          JOIN image on image.id = s1.image
                          WHERE s1.course_id = ?
                          GROUP BY s1.id
                          ORDER BY s1.set_id, s1.set_index`, [id2, id]);
}


async function set_avatar(data) {
    let res = await query(`SELECT id FROM avatar_mapping WHERE language_id = ? AND avatar_id = ?;`, [data.language_id, data.avatar_id]);

    if(res.length) {
        data.id = res[0].id;
        return await update_query("avatar_mapping", data, ["name", "speaker", "language_id", "avatar_id"]);
    }
    return await insert_query("avatar_mapping", data, ["name", "speaker", "language_id", "avatar_id"]);
}

async function set_status(data) {
    return await update_query("story", data, ["status"]);
}

async function set_approve({story_id}, {user_id}) {
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

async function set_import({id, course_id}, {user_id, username}) {
   let data = (await query(`SELECT duo_id, name, image, set_id, set_index, text, json FROM story WHERE id = ?;`, [id]))[0];
   data['author'] = user_id;
   data['course_id'] = course_id;
   data['api'] = 2;

   let res = await insert_query("story", data, ["duo_id", "name", "author", "image", "set_id", "set_index", "course_id", "text", "json", "api"]);
   let new_id = res.insertId;
   let data2 = (await query(`SELECT text,name,course_id, id FROM story WHERE id = ?;`, [new_id]))[0];

   await upload_github(data2['id'], data2["course_id"], data2["text"], username,`added ${data["name"]} in course ${data["course_id"]}`);
   return {id: new_id}
}

async function set_story(data, {username, user_id}) {
    data["api"] = 2;
    data["change_date"] = (new Date()).toISOString();
    data["author_change"] = user_id;

    // if no id is given we look for a
    if(data["id"] === undefined) {
        let res = await query(`SELECT id FROM story WHERE API = 2 AND duo_id = ? AND course_id = ? LIMIT 1;`, [data["duo_id"], data["course_id"]]);
        if(res.length)
            data["id"] = res[0]["id"];
    }

    await update_query("story", data, ["duo_id", "name", "image", "change_date", "author_change", "set_id", "set_index", "course_id", "text", "json", "api"]);

    await upload_github(data['id'], data["course_id"], data["text"], username,`updated ${data["name"]} in course ${data["course_id"]}`);
    return "done"
}

async function delete_story({id}, {username}) {
    await query(`UPDATE story SET deleted = 1, public = 0 WHERE id = ?;`, [id]);
    await upload_github(data['id'], data["course_id"], data["text"], username, `delete ${data["name"]} from course ${data["course_id"]}`, true);
    return "done"
}

function checkAuthentication(req, res, next) {
    // check if the user has the edit role for the editor
    if (req.session.role >= 1)
        return next();

    // if the user is not logged in throw a 403
    res.status(403).send("only for users with editor write permission")
}

router.use(checkAuthentication)
router.get('/editor/courses', func_catch(courses));
router.get('/editor/course/:course_id', func_catch(course));
router.get('/editor/avatar_names/:id', func_catch(avatar_names));
router.get('/editor/speakers/:id', func_catch(speakers));
router.get('/editor/language/:id', func_catch(language));
router.get('/editor/story/:id', func_catch(story));
router.get('/editor/avatar/:id', func_catch(avatar));
router.get('/editor/image/:id', func_catch(image));
router.get('/editor/import/:id/:id2', func_catch(import2));

router.post('/editor/set_avatar', func_catch(set_avatar));
router.post('/editor/set_approve', func_catch(set_approve));
router.get('/editor/set_import/:course_id/:id', func_catch(set_import));
router.post('/editor/set_story', func_catch(set_story));
router.post('/editor/delete_story', func_catch(delete_story));

module.exports = router;
