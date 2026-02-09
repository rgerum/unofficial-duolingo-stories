import { authComponent } from "./betterAuth/auth";
import { query } from "./_generated/server";

export const { getAuthUser } = authComponent.clientApi();

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return {
      ...identity,
      role: identity.role ?? "user",
    };
  },
});
