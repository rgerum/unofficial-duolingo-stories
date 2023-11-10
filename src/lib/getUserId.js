import { authOptions } from "app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";
import { cache } from "react";
import { query_one_obj } from "lib/db";

export const get_user_id_by_name = cache(async (user_name) => {
  // sort courses by base language
  return await query_one_obj(`SELECT id FROM user WHERE username = ? LIMIT 1`, [
    user_name,
  ]);
});

export default async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return undefined;
  return (await get_user_id_by_name(session?.user?.name)).id;
}
