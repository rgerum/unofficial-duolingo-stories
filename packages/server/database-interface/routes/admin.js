const express = require('express');
const query = require("./../includes/db.js");
const {func_catch, update_query} = require("./../includes/includes.js");

let router = express.Router();

async function user_list() {
    return await query(`SELECT user.id, user.username, user.role, user.email, user.regdate, user.activated, user.admin, COUNT(story.id) count FROM user LEFT JOIN story ON story.author = user.id GROUP BY user.id;`);
}

async function language_list() {
    return await query(`SELECT * FROM language;`);
}

async function course_list() {
    return await query(`SELECT * FROM course;`);
}

async function set_language(data) {
    return await update_query('language', data, ["name", "short", "flag", "flag_file", "rtl", "speaker"]);
}

async function set_course(data) {
    if(data["official"] === undefined)
        data["official"] = 0;
    let res = await update_query('course', data, ["learningLanguage", "fromLanguage", "public", "name", "official", "conlang", "about"]);
    let id = data["id"] || res.insertId;
    return await query(`UPDATE course JOIN language l on l.id = course.fromLanguage JOIN language l2 on l2.id = course.learningLanguage
                       SET course.short = CONCAT(l2.short, "-", l.short)
                       WHERE course.id = ?;`, [id]);
}

async function set_user_activate({id, activated}) {
    return await query(`UPDATE user SET activated = ? WHERE user.id = ?;`, [activated, id]);
}

async function set_user_write({id, write}) {
    return await query(`UPDATE user SET role = ? WHERE user.id = ?;`, [write, id]);
}

function checkAuthentication(req, res, next) {
    // check if the user has the edit role for the editor
    if (req.session.admin >= 1)
        return next();

    // if the user is not logged in throw a 403
    res.status(403).send("only for users with admin permission")
}

router.use(checkAuthentication)
router.get('/admin/user_list', func_catch(user_list));
router.get('/admin/language_list', func_catch(language_list));
router.get('/admin/course_list', func_catch(course_list));

router.post('/admin/set_language', func_catch(set_language));
router.post('/admin/set_course', func_catch(set_course));
router.post('/admin/set_user_activate', func_catch(set_user_activate));
router.post('/admin/set_user_write', func_catch(set_user_write));

module.exports = router;