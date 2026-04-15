import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireSessionLegacyUserId } from "./lib/authorization";

export const deleteCurrentUser = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const legacyUserId = await requireSessionLegacyUserId(ctx);
    const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "user",
      where: [{ field: "userId", operator: "eq", value: String(legacyUserId) }],
    })) as { _id?: string | null } | null;

    if (!user?._id) {
      throw new Error("Account not found.");
    }

    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: user._id }],
      },
    });

    return null;
  },
});
