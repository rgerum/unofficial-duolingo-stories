import { notFound } from "next/navigation";
import UserDisplay from "./user_display";
import { sql } from "@/lib/db.ts";

async function user_properties(id) {
  const isNumeric = (value) =>
    value.length !== 0 && [...value].every((c) => c >= "0" && c <= "9");
  if (isNumeric(id)) {
    // if it is a discord ID
    if (id.length >= 10)
      return (
        await sql`SELECT * FROM users WHERE id = (SELECT "userId" FROM accounts where "providerAccountId" = ${id})`
      )[0];
    return (await sql`SELECT * FROM "users" WHERE id = ${id} LIMIT 1;`)[0];
  } else
    return (
      await sql`SELECT * FROM "users" WHERE REPLACE(name, ' ', '') = ${id.replace("%20", "")} LIMIT 1;`
    )[0];
}

export default async function Page({ params }) {
  let user = await user_properties((await params).user_id);

  if (user === undefined) notFound();

  return <UserDisplay user={user} />;
}
