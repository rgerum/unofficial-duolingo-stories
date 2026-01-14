"use server";

import { sql } from "@/lib/db";
import { z } from "zod";

const OkSchema = z.literal("ok");

const SetActivatedInput = z.object({
  id: z.number(),
  activated: z.union([z.boolean(), z.number()]).transform((v) =>
    typeof v === "number" ? v !== 0 : v
  ),
});

const SetWriteInput = z.object({
  id: z.number(),
  write: z.union([z.boolean(), z.number()]).transform((v) =>
    typeof v === "number" ? v !== 0 : v
  ),
});

const DeleteUserInput = z.object({ id: z.number() });

export async function setUserActivatedAction(input: unknown) {
  const parsed = SetActivatedInput.parse(input);
  await sql`UPDATE users SET activated = ${parsed.activated} WHERE id = ${parsed.id};`;
  return OkSchema.parse("ok");
}

export async function setUserWriteAction(input: unknown) {
  const parsed = SetWriteInput.parse(input);
  await sql`UPDATE users SET role = ${parsed.write} WHERE id = ${parsed.id};`;
  return OkSchema.parse("ok");
}

export async function setUserDeleteAction(input: unknown) {
  const parsed = DeleteUserInput.parse(input);
  await sql`DELETE FROM users WHERE id = ${parsed.id};`;
  return OkSchema.parse("ok");
}
