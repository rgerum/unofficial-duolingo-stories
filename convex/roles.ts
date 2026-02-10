import { action } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";

export const setBetterAuthRolesBatch = action({
  args: {
    users: v.array(
      v.object({
        email: v.string(),
        role: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    let skippedMissing = 0;
    let skippedSame = 0;
    const errors: Array<{ email: string; message: string }> = [];

    for (const user of args.users) {
      const email = user.email.toLowerCase();
      try {
        const authUser = await ctx.runQuery(
          components.betterAuth.adapter.findOne,
          {
            model: "user",
            where: [{ field: "email", value: email }],
          },
        );

        if (!authUser?._id) {
          skippedMissing += 1;
          continue;
        }

        const currentRole = Array.isArray(authUser.role)
          ? authUser.role[0]
          : authUser.role;

        if (currentRole === user.role) {
          skippedSame += 1;
          continue;
        }

        await ctx.runMutation(components.betterAuth.adapter.updateOne, {
          input: {
            model: "user",
            where: [{ field: "_id", value: authUser._id }],
            update: { role: user.role } as any,
          },
        });

        updated += 1;
      } catch (error: any) {
        errors.push({
          email,
          message: String(error?.message || error),
        });
      }
    }

    return { updated, skippedMissing, skippedSame, errors };
  },
});
