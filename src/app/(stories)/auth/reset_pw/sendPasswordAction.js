"use server";
import { sql } from "lib/db";
import { v4 as uuid } from "uuid";
import transporter from "lib/emailer";

export default async function sendPasswordAction(email) {
  const currentDate = new Date();
  const tomorrow = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);

  // Format the date and time
  const formattedDate = tomorrow
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);

  let result =
    await sql`SELECT id, email, username FROM "user" WHERE email = ${email} LIMIT 1"`;
  if (result.length === 0) return "done";

  let identifier = uuid();
  await sql`
    INSERT INTO verification_token (token, identifier, expires) VALUES (${identifier}, ${email}, ${formattedDate})`;

  transporter.sendMail({
    from: "Unofficial Duolingo Stories <register@duostories.org>",
    to: email,
    subject: "[Unofficial Duolingo Stories] Reset Password ",
    html: `Hey ${result[0].username},<br/>
            <br/>
            You have requested to reset your password for 'Unofficial Duolingo Stories'.<br/>
            Use the following link to reset your password.<br/>
            <a href='${process.env.NEXTAUTH_URL}/auth/reset_pw/${result[0].username}/${identifier}'>Reset Password</a>
            <br/><br/>
            Happy learning.
        `,
  });
  return "done";
}
