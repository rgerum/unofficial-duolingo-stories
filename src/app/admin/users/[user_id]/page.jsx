import { notFound } from "next/navigation";
import UserDisplay from "./user_display";
import { sql } from "lib/db";

async function user_properties(id) {
  const isNumeric = (value) =>
    value.length !== 0 && [...value].every((c) => c >= "0" && c <= "9");
  if (isNumeric(id))
    return (await sql`SELECT * FROM "users" WHERE id = ${id} LIMIT 1;`)[0];
  else return (await sql`SELECT * FROM "users" WHERE name = ${id} LIMIT 1;`)[0];
}

export default async function Page({ params }) {
  let user = await user_properties(params.user_id);

  if (user === undefined) notFound();

  return <UserDisplay user={user} />;
}
