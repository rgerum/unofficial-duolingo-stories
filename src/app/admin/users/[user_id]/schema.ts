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
  discordStoriesRole: z.string().nullable().optional(),
  discordStoriesSyncStatus: z
    .enum([
      "assigned",
      "up_to_date",
      "no_milestone",
      "not_linked",
      "member_not_found",
      "error",
    ])
    .nullable()
    .optional(),
  discordStoriesLastSyncedAt: z.coerce.date().nullable().optional(),
});

export type AdminUser = z.infer<typeof UserSchema>;
