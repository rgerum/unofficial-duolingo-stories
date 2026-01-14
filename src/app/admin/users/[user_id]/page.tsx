import { notFound } from "next/navigation";
import UserDisplay from "./user_display";
import { sql } from "@/lib/db";
import { UserSchema } from "./schema";

async function user_properties(id: string) {
  const isNumeric = (value: string) =>
    value.length !== 0 && [...value].every((c) => c >= "0" && c <= "9");
  if (isNumeric(id)) {
    // if it is a discord ID
    if (id.length >= 10) {
      const row = (
        await sql`SELECT id, name, email, regdate, activated, role FROM users WHERE id = (SELECT "userId" FROM accounts where "providerAccountId" = ${id})`
      )[0];
      return row ? UserSchema.parse(row) : undefined;
    }
    const row = (
      await sql`SELECT id, name, email, regdate, activated, role FROM "users" WHERE id = ${id} LIMIT 1;`
    )[0];
    return row ? UserSchema.parse(row) : undefined;
  } else
    {
      const row = (
        await sql`SELECT id, name, email, regdate, activated, role FROM "users" WHERE REPLACE(name, ' ', '') = ${id.replace("%20", "")} LIMIT 1;`
      )[0];
      return row ? UserSchema.parse(row) : undefined;
    }
}

export default async function Page({
  params,
}: {
  params: Promise<{ user_id: string }>;
}) {
  const user = await user_properties((await params).user_id);
  console.log(user);

  if (user === undefined) notFound();

  return <UserDisplay user={user} />;
}
