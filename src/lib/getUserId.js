import { authOptions } from "app/api/auth/[...nextauth]/authOptions";
import { getServerSession } from "next-auth/next";
import { cache } from "react";
import { sql } from "lib/db";

export const get_user_id_by_name = cache(async (user_name) => {
  return (
    await sql`SELECT id FROM "users" WHERE name = ${user_name} LIMIT 1`
  )[0];
});

export default async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return undefined;
  return (await get_user_id_by_name(session?.user?.name)).id;
}
