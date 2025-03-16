"use server";
import { sql } from "@/lib/db";
import { phpbb_check_hash } from "@/lib/auth/hash_functions2";

export async function authorizeUser(credentials: any) {
  console.log("authorize", credentials);
  let res2 =
    await sql`SELECT * FROM users WHERE LOWER(name) = ${credentials.username.toLowerCase()} AND activated`;
  if (res2.length === 0) {
    throw new Error("Invalid credentials.");
  }
  let user = res2[0];

  let correct = phpbb_check_hash(credentials.password, user.password);
  if (!correct) {
    console.log("incorrect password");
    throw new Error("Invalid credentials.");
  }

  console.log({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    regdate: user.regdate,
    role: user.role,
    admin: user.admin,
    activated: user.activated,
    activation_link: user.activation_link,
  });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    regdate: user.regdate,
    role: user.role,
    admin: user.admin,
    activated: user.activated,
    activation_link: user.activation_link,
  };
  return { username: credentials.username, role: true, admin: true };
}
