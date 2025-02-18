"use server";
import { sql } from "@/lib/db";
import { phpbb_check_hash } from "@/lib/auth/hash_functions2";

export default async function authorize(
  credentials: Partial<Record<"password" | "username", unknown>>,
) {
  if (typeof credentials.password !== "string")
    throw new Error("Invalid credentials.");
  if (typeof credentials.username !== "string")
    throw new Error("Invalid credentials.");

  let res2 =
    await sql`SELECT * FROM users WHERE LOWER(name) = ${credentials.username.toLowerCase() || ""} AND activated`;

  if (res2.length === 0) {
    throw new Error("Invalid credentials.");
  }
  let user = res2[0];

  let correct = phpbb_check_hash(credentials.password, user.password);

  if (!correct) {
    throw new Error("Invalid credentials.");
  }

  return {
    name: user.name,
    email: user.email,
    id: user.id,
    user_id: user.id,
    role: user.role,
    admin: user.admin,
  };
}
