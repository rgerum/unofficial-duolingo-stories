import React from "react";
import ResetPassword from "./reset_pw";
import { phpbb_hash } from "lib/auth/hash_functions2";
import query from "lib/db";

async function changePasswordAction(password, user_id) {
  let password_hashed = await phpbb_hash(password);

  // set the new password
  await query("UPDATE user SET password = ? WHERE id = ?;", [
    password_hashed,
    user_id,
  ]);
}

async function check_link(username, hash) {
  let result = await query(
    "SELECT id, email FROM user WHERE LOWER(username) = LOWER(?)",
    [username],
  );
  if (result.length === 0) {
    return undefined;
  }
  // Format the date and time
  const formattedDate = new Date()
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);
  // activate the user
  let result2 = await query(
    "SELECT id FROM verification_token WHERE token = ? AND identifier = ? AND expires > ? LIMIT 1",
    [hash, result[0].email, formattedDate],
  );
  if (result2.length === 0) {
    return undefined;
  }
  return result[0].id;
}

export default async function Page({ params }) {
  let user_id = await check_link(params.username, params.hash);
  if (!user_id) {
    return (
      <div id="login_dialog">
        <p id="status">Invalid or expired link.</p>
      </div>
    );
  }
  async function callChangePasswordAction(password) {
    "use server";
    return await changePasswordAction(password, user_id);
  }

  return <ResetPassword callchangePasswordAction={callChangePasswordAction} />;
}
