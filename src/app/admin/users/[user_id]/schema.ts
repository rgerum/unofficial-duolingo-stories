import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().or(z.string().min(1)),
  regdate: z.coerce.date(),
  activated: z.coerce.boolean(),
  role: z.coerce.boolean(),
});

export type AdminUser = z.infer<typeof UserSchema>;
