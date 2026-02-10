"use server";

import { z } from "zod";
import { fetchAuthMutation, fetchAuthQuery } from "@/lib/auth-server";
import { components } from "@convex/_generated/api";

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

async function findUserByNumericId(id: number) {
  const response = (await fetchAuthQuery(
    components.betterAuth.adapter.findMany as any,
    {
      model: "user",
      where: [],
      paginationOpts: { cursor: null, numItems: 1000 },
    },
  )) as any;
  return response.page.find(
    (user: { userId?: string | null }) => Number(user.userId) === id,
  ) as { _id: string } | undefined;
}

export async function setUserActivatedAction(input: unknown) {
  const parsed = SetActivatedInput.parse(input);
  const user = await findUserByNumericId(parsed.id);
  if (!user?._id) return OkSchema.parse("ok");
  await fetchAuthMutation(components.betterAuth.adapter.updateOne as any, {
    input: {
      model: "user",
      where: [{ field: "_id", value: user._id }],
      update: { emailVerified: parsed.activated },
    },
  });
  return OkSchema.parse("ok");
}

export async function setUserWriteAction(input: unknown) {
  const parsed = SetWriteInput.parse(input);
  const user = await findUserByNumericId(parsed.id);
  if (!user?._id) return OkSchema.parse("ok");
  await fetchAuthMutation(components.betterAuth.adapter.updateOne as any, {
    input: {
      model: "user",
      where: [{ field: "_id", value: user._id }],
      update: { role: parsed.write ? "contributor" : "user" },
    },
  });
  return OkSchema.parse("ok");
}

export async function setUserDeleteAction(input: unknown) {
  const parsed = DeleteUserInput.parse(input);
  const user = await findUserByNumericId(parsed.id);
  if (!user?._id) return OkSchema.parse("ok");
  await fetchAuthMutation(components.betterAuth.adapter.deleteOne as any, {
    input: {
      model: "user",
      where: [{ field: "_id", value: user._id }],
    },
  });
  return OkSchema.parse("ok");
}
