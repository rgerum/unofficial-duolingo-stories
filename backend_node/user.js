const express = require('express');
const nodemailer = require("nodemailer");
const query = require("./db.js");
const phpbb_check_hash = require("./hash_functions2");

let router = express.Router();

let transporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail'
});

router.get('/register', function (req, res) {
    transporter.sendMail({
        from: 'Unofficial Duolingo Stories <register@duostories.org>',
        subject: '[Unofficial Duolingo Stories] Registration ',
        html: `Hey $username,<br/>
            <br/>
            You have registered on 'Unofficial Duolingo Stories'.<br/>
            To complete your registration click on the following link.<br/>
            <a href='https://www.duostories.org/task/activate/$username/$activation_link'>Activate account</a>
            <br/><br/>
            Happy learning.
            "
        `
    }, (err, info) => {
        console.log(info.envelope);
        console.log(info.messageId);
    });
});

router.get('/session', function (req, res) {
    res.json(req.session);
})


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

        // save the session before redirection to ensure page
        // load does not happen before session is saved
        req.session.save(function (err) {
            if (err) return next(err)
            res.send("done")
        })
    })
})

router.get('/logout',(req,res) => {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.send("done")
        //res.redirect(path+'/');
    });

});

module.exports = router;
