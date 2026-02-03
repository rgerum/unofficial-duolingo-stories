import { sql } from "@/lib/db.ts";
const { phpbb_hash } = require("lib/auth/hash_functions2");
import { v4 as uuid } from "uuid";
import { NextResponse } from "next/server";
import transporter from "@/lib/emailer";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(req) {
  const res = await req.json();
  let ret = await register(res);
  if (ret?.status) return new Response(ret?.message, { status: ret.status });
  return NextResponse.json(ret);
}

async function check_username(name, existing) {
  let result =
    await sql`SELECT id, email FROM "users" WHERE LOWER(name) = LOWER(${name})`;
  if (existing) {
    if (result.length) {
      return result[0];
    }
    return { status: 403, message: "Error username does not exists" };
  } else {
    if (result.length) {
      return { status: 403, message: "Error username already exists" };
    }
    return true;
  }
}

async function register({ name, password, email }) {
  // check username
  let username_check = await check_username(name, false);
  if (username_check?.status) return username_check;

  let password_hashed = await phpbb_hash(password);
  let activation_link = uuid();
  await sql`INSERT INTO "users" ${sql({
    name: name,
    email: email,
    password: password_hashed,
    activation_link: activation_link,
  })}`;
  await transporter.sendMail({
    from: "Unofficial Duolingo Stories <register@duostories.org>",
    to: email,
    subject: "[Unofficial Duolingo Stories] Registration ",
    html: `Hey ${name},<br/>
            <br/>
            You have registered on 'Unofficial Duolingo Stories'.<br/>
            To complete your registration click on the following link.<br/>
            <a href='${process.env.NEXTAUTH_URL}/auth/activate/${name}/${activation_link}'>Activate account</a>
            <br/><br/>
            Happy learning.
        `,
  });

  // Track server-side user registration event
  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: name,
    event: "user_registered_server",
    properties: {
      username: name,
      registration_method: "email",
    },
  });
  // Identify user on server side
  posthog.identify({
    distinctId: name,
    properties: {
      username: name,
      email: email,
      createdAt: new Date().toISOString(),
    },
  });
  await posthog.shutdown();

  return "done";
}
