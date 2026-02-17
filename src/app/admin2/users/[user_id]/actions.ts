"use server";

import { z } from "zod";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

const OkSchema = z.literal("ok");

const SetActivatedInput = z.object({
  id: z.number(),
  activated: z
    .union([z.boolean(), z.number()])
    .transform((v) => (typeof v === "number" ? v !== 0 : v)),
});

const SetWriteInput = z.object({
  id: z.number(),
  write: z
    .union([z.boolean(), z.number()])
    .transform((v) => (typeof v === "number" ? v !== 0 : v)),
});

const DeleteUserInput = z.object({ id: z.number() });

export async function setUserActivatedAction(input: unknown) {
  const parsed = SetActivatedInput.parse(input);
  await fetchAuthMutation(api.adminData.setAdminUserActivated, {
    id: parsed.id,
    activated: parsed.activated,
  });
  return OkSchema.parse("ok");
}

export async function setUserWriteAction(input: unknown) {
  const parsed = SetWriteInput.parse(input);
  await fetchAuthMutation(api.adminData.setAdminUserWrite, {
    id: parsed.id,
    write: parsed.write,
  });
  return OkSchema.parse("ok");
}

export async function setUserDeleteAction(input: unknown) {
  const parsed = DeleteUserInput.parse(input);
  await fetchAuthMutation(api.adminData.setAdminUserDelete, {
    id: parsed.id,
  });
  return OkSchema.parse("ok");
}
