const express = require('express');
const nodemailer = require("nodemailer");
const query = require("./../includes/db.js");
const {func_catch} = require("./../includes/includes.js");
const {phpbb_check_hash, phpbb_hash} = require("./../includes/hash_functions2");
const util = require('util')
const { uuid } = require('uuidv4');


let router = express.Router();

let transporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail'
});

async function check_username(username, existing) {
    let result = await query("SELECT id, email FROM user WHERE LOWER(username) = LOWER(?)", [username]);
    console.log("check_username->result", result, username, existing)
    if(existing) {
        if(result.length) {
            return result[0];
        }
        return {status: 403, message: "Error username does not exists"};
    }
    else {
        if(result.length) {
            return {status: 403, message: "Error username already exists"};
        }
        return true;
    }
}

async function register({username, password, email}) {
    // check username
    let username_check = await check_username(username, false);
    console.log("username_check", username_check)
    if(username_check?.status)
        return username_check

    console.log("hash")
    let password_hashed = await phpbb_hash(password);
    console.log("hash", password_hashed)
    let activation_link = uuid();
    await query("INSERT INTO user (username, email, password, activation_link) VALUES(?, ?, ?, ?)", [username, email, password_hashed, activation_link]);
    console.log("user inserted")
    transporter.sendMail({
        from: 'Unofficial Duolingo Stories <register@duostories.org>',
        to: email,
        subject: '[Unofficial Duolingo Stories] Registration ',
        html: `Hey ${username},<br/>
            <br/>
            You have registered on 'Unofficial Duolingo Stories'.<br/>
            To complete your registration click on the following link.<br/>
            <a href='https://www.duostories.org/task/activate/${username}/${activation_link}'>Activate account</a>
            <br/><br/>
            Happy learning.
        `
    })
    return "done";
}

async function activate({username, activation_link}) {

    // check username
    let username_check = await check_username(username, true);
    if(username_check?.status)
        return username_check
    let result = await query("UPDATE user SET activated = 1 WHERE username = ? AND activation_link = ?;", [username, activation_link]);

    if(result.affectedRows)
        return "done";
    return {status: 403, message:"Username or activation link do not exist."}
}

async function send({username}) {

    // check username
    let username_check = await check_username(username, true);
    if(username_check?.status)
        return username_check
    let {id, email} = username_check;

    let activation_link = uuid();
    await query("INSERT INTO user_pw_reset (user_id, uuid) VALUES(?, ?)", [id, activation_link]);

    transporter.sendMail({
        from: 'Unofficial Duolingo Stories <register@duostories.org>',
        to: email,
        subject: `[Unofficial Duolingo Stories] Reset Password ${username}`,
        html: `Hey ${username},<br/>
        You or someone else has requested a new password for 'Unofficial Duolingo Stories'.<br/>
        Use the following link to change your password (the link is valid for one day).<br/>
        <a href='https://www.duostories.org/task/resetpw/${username}/${activation_link}'>Reset password</a>
        <br/><br/>
        Happy learning.
        `
    }, (err, info) => {
        console.log(info.envelope);
        console.log(info.messageId);
    });
    return "1";
}


async function checkUUID(id, uuid) {
    // delete old
    await query("DELETE FROM user_pw_reset WHERE TIMESTAMPDIFF(DAY, time, CURRENT_TIMESTAMP()) > 1");
    let result = await query("SELECT id FROM user_pw_reset WHERE user_id = ? AND uuid = ?", [id, uuid]);

    return !!result.length;

}

async function check({username, uuid},) {
    let username_check = await check_username(username, true);
    if(username_check?.status)
        return username_check
    let {id} = username_check;

    console.log("checkuuid", id,uuid, await checkUUID(id, uuid));
    if(await checkUUID(id, uuid)) {
        return "1";
    }
    else {
        return {status: 403, message: "0"}
    }
}

async function set({username, password, uuid},) {
    let password_hashed = await phpbb_hash(password);
    let username_check = await check_username(username, true);
    if(username_check?.status)
        return username_check
    let {id} = username_check;

    if(await checkUUID(id, uuid)) {
        // update the password
        await query("UPDATE user SET password = ? WHERE id = ?", [password_hashed, id]);
        // link is only valid once
        await query("DELETE FROM user_pw_reset WHERE user_id = ? AND uuid = ?", [id, uuid]);

        return "1";
    }
    else {
        return {status: 403, message: "0"}
    }
}

async function session({}, session) {
    console.log("session", session)
    return session;
}

async function regenerate(session) {
    return new Promise(function(resolve, reject) {
        session.regenerate(function(err) {
            console.log("---", err)
            if(err)
                return reject(err);
            console.log("**", )
            resolve();
        });
    });
}

async function save(session) {
    return new Promise(function(resolve, reject) {
        session.save(function(err) {
            console.log("---", err)
            if(err)
                return reject(err);
            console.log("**", )
            resolve();
        });
    });
}

async function login({username, password, remember}, session) {
    console.log("login", username, session)
    let res2 = await query(`SELECT * FROM user WHERE username = ? AND activated = 1`, username);

    if(res2.length === 0) {
        return {status: 403, message: `wrong username`};
    }
    let user = res2[0];
    console.log("phpbb_check_hash", password, user.password)
    let correct = await phpbb_check_hash(password, user.password)
    console.log("correct", correct)
    if (!correct) {
        return {status: 403, message: `wrong password`};
    }

    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    console.log("regenerate")
    await regenerate(session);
    console.log("regenerated")

    console.log("store", user)
    // store user information in session, typically a user id
    session.username = user.username;
    session.user_id = user.id;
    session.role = user.role;
    session.admin = user.admin;
    console.log("remember")
    // if it should be remembered set the duration to 30 days
    if(remember) {
        const hour = 3600000 * 24 * 30
        session.cookie.expires = new Date(Date.now() + hour)
        session.cookie.maxAge = hour
    }
    console.log("sae")
    // save the session before redirection to ensure page
    // load does not happen before session is saved
    await save(session);
    console.log("done", session)
    return session;
}

async function logout({}, session) {
    const err = await util.promisify(session.destroy)();
    if (err) return next(err);
    return "done";
}

router.post('/register', func_catch(register));
router.post('/activate', func_catch(activate));

router.post('/send', func_catch(send));
router.post('/check', func_catch(check));
router.post('/set', func_catch(set));

router.get('/session', func_catch(session));
//router.post('/login', func_catch(login));
//router.get('/logout', func_catch(logout));

//router.get('/session', function (req, res) {
//    res.json(req.session);
//})

router.get('/logout',(req,res) => {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.send("done")
        //res.redirect(path+'/');
    });

});

router.post('/login', async function (req, res) {
    let res2 = await query(`SELECT * FROM user WHERE username = ? AND activated = 1`, req.body.username);

    if(res2.length === 0) {
        res.send("no user");
        return
    }
    let user = res2[0];

    let correct = await phpbb_check_hash(req.body.password, user.password)
    if (!correct) {
        return res.send(`wrong password`);
    }

    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate(function (err) {
        if (err) next(err)

        // store user information in session, typically a user id
        req.session.username = res2[0].username;
        req.session.user_id = res2[0].id;
        req.session.role = res2[0].role;
        req.session.admin = res2[0].admin;

        // if it should be remembered set the duration to 30 days
        if(req.body.remember) {
            const hour = 3600000 * 24 * 30
            req.session.cookie.expires = new Date(Date.now() + hour)
            req.session.cookie.maxAge = hour
        }

        // save the session before redirection to ensure page
        // load does not happen before session is saved
        req.session.save(function (err) {
            if (err) return next(err)
            res.json(req.session)
        })
    })
})


module.exports = router;
