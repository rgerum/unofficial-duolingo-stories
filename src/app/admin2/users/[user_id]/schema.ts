import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().or(z.string().min(1)),
  regdate: z.coerce.date().optional(),
  activated: z.coerce.boolean().optional(),
  role: z.coerce.boolean().optional(),
  admin: z.coerce.boolean().optional(),
});

export type Admin2User = z.infer<typeof UserSchema>;
