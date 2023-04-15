import query from "../../../lib/db"
const {phpbb_check_hash, phpbb_hash} = require("./../../../lib/auth/hash_functions2");
const { uuid } = require('uuidv4');
const nodemailer = require("nodemailer");

export default async (req, res) => {
    try {
        console.log("call")
        let ret = await reqister(req.body);
        console.log("call", ret)
        if(ret?.status)
            return res.status(ret.status).send(ret?.message);
        console.log("call end")
        return res.json(ret);//
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

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

async function reqister({username, password, email}){
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
            <a href='${process.env.NEXTAUTH_URL}/activate/${username}/${activation_link}'>Activate account</a>
            <br/><br/>
            Happy learning.
        `
    })
    return "done";
}