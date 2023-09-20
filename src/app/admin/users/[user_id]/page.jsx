import { notFound } from "next/navigation";
import UserDisplay from "./user_display";
import { query_one_obj } from "lib/db";

async function user_properties(id) {
  const isNumeric = (value) =>
    value.length !== 0 && [...value].every((c) => c >= "0" && c <= "9");
  if (isNumeric(id))
    return await query_one_obj(`SELECT * FROM user WHERE id = ?;`, [
      parseInt(id),
    ]);
  else
    return await query_one_obj(`SELECT * FROM user WHERE username = ?;`, [id]);
}

export default async function Page({ params }) {
  let user = await user_properties(params.user_id);

  if (user === undefined) notFound();

  return <UserDisplay user={user} />;
}
