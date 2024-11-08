import { auth } from "@/auth";
import { sql, cache } from "@/lib/db";

export const get_user_id_by_name = cache(
  async (user_name) => {
    return (
      await sql`SELECT id FROM "users" WHERE name = ${user_name} LIMIT 1`
    )[0];
  },
  ["get_user_id_by_name"],
);

export default async function getUserId() {
  const session = await auth();
  if (!session?.user?.name) return undefined;
  return (await get_user_id_by_name(session?.user?.name)).id;
}
