import React from "react";
import ResetPassword from "./reset_pw";
import { phpbb_hash } from "@/lib/auth/hash_functions2";
import { sql } from "@/lib/db";

function isValidUUIDv4(uuid: string): boolean {
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(uuid);
}

async function changePasswordAction(
  password: string,
  user_id: number,
): Promise<void> {
  const password_hashed = await phpbb_hash(password);

  // set the new password
  await sql`UPDATE users SET password = ${password_hashed} WHERE id = ${user_id};`;
}

interface CheckLinkResult {
  data?: number;
  error?: { title: string; text?: string };
}

async function check_link(
  name: string,
  hash: string,
): Promise<CheckLinkResult> {
  let user_id = parseInt(name);
  let result = !isNaN(user_id)
    ? await sql`SELECT id, email FROM "users" WHERE id = ${user_id}`
    : await sql`SELECT id, email FROM "users" WHERE name = ${name}`;
  if (result.length === 0) {
    return { error: { title: `User '${name}' does not exist.` } };
  }
  if (!isValidUUIDv4(hash)) {
    return { error: { title: `Link '${hash}' has invalid shape.` } };
  }
  // Format the date and time
  const formattedDate = new Date()
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);
  // activate the user
  let result2 =
    await sql`SELECT id FROM verification_token WHERE token = ${hash} AND identifier = ${result[0].email} AND expires > ${formattedDate} LIMIT 1`;
  if (result2.length === 0) {
    let result3 =
      await sql`SELECT id,expires FROM verification_token WHERE token = ${hash} AND identifier = ${result[0].email} LIMIT 1`;
    if (result3 && result3.length > 0) {
      return {
        error: {
          text: `expired ${result3[0].expires}`,
          title: "Expired link.",
        },
      };
    }
    return { error: { title: "Invalid Link", text: "" } };
  }
  return { data: result[0].id };
}

interface PageProps {
  params: Promise<{ name: string; hash: string }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const { data: user_id, error } = await check_link(
    resolvedParams.name,
    resolvedParams.hash,
  );
  if (error) {
    return (
      <div id="login_dialog">
        <p id="status">{error.title}</p>
        <p>{error.text}</p>
      </div>
    );
  }
  if (!user_id) {
    return (
      <div id="login_dialog">
        <p id="status">Invalid link.</p>
      </div>
    );
  }
  async function callChangePasswordAction(password: string) {
    "use server";
    return await changePasswordAction(password, user_id!);
  }

  return <ResetPassword callchangePasswordAction={callChangePasswordAction} />;
}
