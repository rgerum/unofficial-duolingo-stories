import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { admin, username } from "better-auth/plugins";
import { defaultRoles, userAc } from "better-auth/plugins/admin/access";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import authConfig from "../auth.config";
import { phpbbCheckHash, phpbbHash } from "../lib/phpbb";
import schema from "./schema";

const getEnv = (...keys: string[]) =>
  keys.map((key) => process.env[key]).find((value) => value);

const getSocialProvider = (idKeys: string[], secretKeys: string[]) => {
  const clientId = getEnv(...idKeys);
  const clientSecret = getEnv(...secretKeys);
  if (!clientId || !clientSecret) return undefined;
  return { clientId, clientSecret };
};

const socialProviders = Object.fromEntries(
  Object.entries({
    github: getSocialProvider(
      ["GITHUB_CLIENT_ID", "GITHUB_ID", "AUTH_GITHUB_ID"],
      ["GITHUB_CLIENT_SECRET", "GITHUB_SECRET", "AUTH_GITHUB_SECRET"],
    ),
    google: getSocialProvider(
      ["GOOGLE_CLIENT_ID", "AUTH_GOOGLE_ID"],
      ["GOOGLE_CLIENT_SECRET", "AUTH_GOOGLE_SECRET"],
    ),
    discord: getSocialProvider(
      ["DISCORD_CLIENT_ID", "AUTH_DISCORD_CLIENT_ID"],
      ["DISCORD_CLIENT_SECRET", "AUTH_DISCORD_CLIENT_SECRET"],
    ),
    facebook: getSocialProvider(
      ["FACEBOOK_CLIENT_ID", "AUTH_FACEBOOK_ID"],
      ["FACEBOOK_CLIENT_SECRET", "AUTH_FACEBOOK_SECRET"],
    ),
  }).filter(([, value]) => value),
);

// Better Auth Component
export const authComponent = createClient<DataModel, typeof schema>(
  components.betterAuth,
  {
    local: { schema },
    verbose: false,
  },
);

// Better Auth Options
export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    appName: "Duostories",
    baseURL: process.env.SITE_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    socialProviders,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      password: {
        hash: async (password) => phpbbHash(password),
        verify: async ({ password, hash }) => phpbbCheckHash(password, hash),
      },
    },
    plugins: [
      convex({ authConfig }),
      username(),
      admin({
        adminRoles: ["admin"],
        roles: {
          ...defaultRoles,
          editor: userAc,
          contributor: userAc,
        },
      }),
    ],
  } satisfies BetterAuthOptions;
};

// For `@better-auth/cli`
export const options = createAuthOptions({} as GenericCtx<DataModel>);

// Better Auth Instance
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};
