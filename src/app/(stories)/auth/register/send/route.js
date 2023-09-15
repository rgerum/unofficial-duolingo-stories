import query from "lib/db"
const {phpbb_hash} = require("lib/auth/hash_functions2");
import { v4 as uuid } from 'uuid';
import {NextResponse} from "next/server";
const nodemailer = require("nodemailer");

export async function POST(req) {
    try {
        const res = await req.json()
        let ret = await register(res);
        if(ret?.status)
            return new Response(ret?.message, {status: ret.status})
        return NextResponse.json(ret);
    }
    catch (err) {
        return new Response(err.message, {status: 500})
    }
}

let transporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail'
});


async function check_username(username, existing) {
    let result = await query("SELECT id, email FROM user WHERE LOWER(username) = LOWER(?)", [username]);
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

async function register({username, password, email}){
    // check username
    let username_check = await check_username(username, false);
    if(username_check?.status)
        return username_check

    let password_hashed = await phpbb_hash(password);
    let activation_link = uuid();
    await query("INSERT INTO user (username, email, password, activation_link) VALUES(?, ?, ?, ?)", [username, email, password_hashed, activation_link]);
    transporter.sendMail({
        from: 'Unofficial Duolingo Stories <register@duostories.org>',
        to: email,
        subject: '[Unofficial Duolingo Stories] Registration ',
        html: `Hey ${username},<br/>
            <br/>
            You have registered on 'Unofficial Duolingo Stories'.<br/>
            To complete your registration click on the following link.<br/>
            <a href='${process.env.NEXTAUTH_URL}/auth/activate/${username}/${activation_link}'>Activate account</a>
            <br/><br/>
            Happy learning.
        `
    })
    return "done";
}