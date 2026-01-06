import { Pool } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { phpbb_check_hash } from "@/lib/auth/hash_functions2";
import { username } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  logger: {
    disabled: false,
    disableColors: false,
    level: "debug",
    log: (level, message, ...args) => {
      // Custom logging implementation
      console.log(`[${level}] ${message}`, ...args);
    },
  },
  session: {
    modelName: "session_better_auth",
    strategy: "jwt",
    fieldsX: {
      expiresAt: "expires", // Map your existing `expires` field to Better Auth's `expiresAt`
      token: "sessionToken", // Map your existing `sessionToken` field to Better Auth's `token`
    },
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds (5 minutes)
    },
  },
  verification: {
    modelName: "verification_better_auth",
  },
  user: {
    modelName: "user_better_auth",
    fieldsX: {
      id: "useridstring",
      createdAt: "regdate",
      updatedAt: "updatedat",
      emailVerified: "activated",
    },
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: false,
        input: false, // don't allow user to set role
      },
      admin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  account: {
    modelName: "account_better_auth",
    fieldsX: {
      accountId: "providerAccountId",
      refreshToken: "refresh_token",
      accessToken: "access_token",
      accessTokenExpiresAt: "access_token_expires",
      idToken: "id_token",
      providerId: "provider",
    },
  },
  pages: {
    signIn: "/auth/signin",
    //signOut: '/auth/signout',
    //error: '/auth/error',
    //verifyRequest: '/auth/verify-request',
    //newUser: '/auth/new-user'
  },
  emailAndPassword: {
    enabled: true,
    password: {
      //hash: authorizeUser, // your custom password hashing function
      //verify: async (data) => phpbb_check_hash(data.password, data.hash), // your custom password verification function
    },
    requireEmailVerification: true,

    sendResetPassword: async ({ user, url, token }, request) => {
      console.log("sendResetPassword", user, url, token);
      await resend.emails.send({
        from: "Unofficial Duolingo Stories <register@duostories.org>",
        to: user.email,
        subject: "Reset your password",
        html: `Hey ${user.name},<br/>
            <br/>
            You have requested to reset your password for 'Unofficial Duolingo Stories'.<br/>
            Use the following link to reset your password.<br/>
            <a href='${url}'>Reset Password</a>
            <br/><br/>
            Happy learning.
        `,
      });
    },
    onPasswordReset: async ({ user }, request) => {
      // your logic here
      console.log(`Password for user ${user.email} has been reset.`);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      console.log("verificationEmail", user, url, token);
      await resend.emails.send({
        from: "Unofficial Duolingo Stories <register@duostories.org>",
        to: user.email,
        subject: "[Unofficial Duolingo Stories] Registration ",
        html: `Hey ${user.name},<br/>
            <br/>
            You have registered on 'Unofficial Duolingo Stories'.<br/>
            To complete your registration click on the following link.<br/>
            <a href='${url}'>Activate account</a>
            <br/><br/>
            Happy learning.
        `,
      });
    },
  },
  plugins: [nextCookies(), username()],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    },
    facebook: {
      clientId: process.env.AUTH_FACEBOOK_ID as string,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET as string,
    },
    google: {
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
    },
    discord: {
      clientId: process.env.AUTH_DISCORD_CLIENT_ID as string,
      clientSecret: process.env.AUTH_DISCORD_CLIENT_SECRET as string,
    },
  },
});
