import { v } from "convex/values";
import { query } from "./_generated/server";
import { getEnabledSocialProviderIds } from "./authProviderConfig";

const socialProviderIdValidator = v.union(
  v.literal("apple"),
  v.literal("google"),
  v.literal("github"),
  v.literal("discord"),
);

export const getEnabledSocialProviders = query({
  args: {},
  returns: v.array(socialProviderIdValidator),
  handler: async () => getEnabledSocialProviderIds(),
});
