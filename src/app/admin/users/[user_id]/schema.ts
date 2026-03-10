import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().or(z.string().min(1)),
  regdate: z.coerce.date().optional(),
  activated: z.coerce.boolean().optional(),
  role: z.coerce.boolean().optional(),
  admin: z.coerce.boolean().optional(),
  discordLinked: z.coerce.boolean().optional(),
  discordAccountId: z.string().nullable().optional(),
});

export type AdminUser = z.infer<typeof UserSchema>;
