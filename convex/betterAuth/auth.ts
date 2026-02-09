import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { admin, username } from "better-auth/plugins";
import { defaultRoles, userAc } from "better-auth/plugins/admin/access";
import { components, internal } from "../_generated/api";
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

const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Unofficial Duolingo Stories <register@duostories.org>",
      to,
      subject,
      html,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${text}`);
  }
};

// Better Auth Component
export const authComponent: ReturnType<typeof createClient> = createClient<
  DataModel,
  typeof schema
>(components.betterAuth, {
  local: { schema },
  verbose: false,
  authFunctions: {
    onCreate: internal.authFunctions.onCreate,
  },
  triggers: {
    user: {
      onCreate: async () => {},
    },
  },
});

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
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "[Unofficial Duolingo Stories] Reset Password",
          html: `Hey ${user.name ?? "there"},<br/>
            <br/>
            You have requested to reset your password for 'Unofficial Duolingo Stories'.<br/>
            Use the following link to reset your password.<br/>
            <a href='${url}'>Reset Password</a>
            <br/><br/>
            Happy learning.`,
        });
      },
      password: {
        hash: async (password) => phpbbHash(password),
        verify: async ({ password, hash }) => phpbbCheckHash(password, hash),
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "[Unofficial Duolingo Stories] Verify Email",
          html: `Hey ${user.name ?? "there"},<br/>
            <br/>
            Please verify your email address by clicking the link below.<br/>
            <a href='${url}'>Verify Email</a>
            <br/><br/>
            Happy learning.`,
        });
      },
    },
    plugins: [
      convex({ authConfig }),
      username(),
      admin({
        adminRoles: ["admin"],
        roles: {
          ...defaultRoles,
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
