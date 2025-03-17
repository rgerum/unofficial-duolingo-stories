import { sql, cache } from "@/lib/db";
import { getUser } from "@/lib/userInterface";

export const get_user_id_by_name = cache(
  async (user_name: string) => {
    return (
      await sql`SELECT id FROM "users" WHERE name = ${user_name} LIMIT 1`
    )[0];
  },
  ["get_user_id_by_name"],
);

export default async function getUserId() {
  const user = await getUser();
  if (!user?.name) return undefined;
  return (await get_user_id_by_name(user?.name)).id as number;
}
