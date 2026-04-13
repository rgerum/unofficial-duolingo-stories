"use server";

import { createServerFn } from "@tanstack/react-start";
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

export const setUserActivatedAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SetActivatedInput.parse(input))
  .handler(async ({ data }) => {
    await fetchAuthMutation(api.adminData.setAdminUserActivated, {
      id: data.id,
      activated: data.activated,
    });
    return OkSchema.parse("ok");
  });

export const setUserWriteAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SetWriteInput.parse(input))
  .handler(async ({ data }) => {
    await fetchAuthMutation(api.adminData.setAdminUserWrite, {
      id: data.id,
      write: data.write,
    });
    return OkSchema.parse("ok");
  });

export const setUserDeleteAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DeleteUserInput.parse(input))
  .handler(async ({ data }) => {
    await fetchAuthMutation(api.adminData.setAdminUserDelete, {
      id: data.id,
    });
    return OkSchema.parse("ok");
  });
