import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";

import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "@neondatabase/serverless";
import Credentials from "next-auth/providers/credentials";

import { authorizeUser } from "@/authorize";

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface User {
    role: boolean;
    admin: boolean;
  }
  interface JWT {
    role: boolean;
    admin: boolean;
  }
  interface Session {
    user: {
      /** The user's postal address. */
      role: boolean;
      admin: boolean;
      /**
       * By default, TypeScript merges new interface properties and overwrites existing ones.
       * In this case, the default session user properties will be overwritten,
       * with the new ones defined above. To keep the default session user properties,
       * you need to add them back into the newly declared interface.
       */
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  // Create a `Pool` inside the request handler.
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // @ts-ignore
  return {
    adapter: PostgresAdapter(pool),
    session: { strategy: "jwt" },
    callbacks: {
      jwt({ token, user }) {
        if (user) {
          token.admin = user.admin;
          token.role = user.role;
          token.id = user.id;
        }
        return token;
      },
      session({ session, token }) {
        if (!token) return session;
        session.user.admin = token.admin as boolean;
        session.user.role = token.role as boolean;
        session.user.id = token.id as string;

        return session;
      },
    },
    pages: {
      signIn: "/auth/signin",
      //signOut: '/auth/signout',
      //error: '/auth/error',
      //verifyRequest: '/auth/verify-request',
      //newUser: '/auth/new-user'
    },
    providers: [
      GitHub,
      Facebook,
      Google,
      Discord,
      Credentials({
        credentials: {
          username: {
            label: "Username",
            type: "text",
            placeholder: "username",
          },
          password: { label: "Password", type: "password" },
        },
        authorize: authorizeUser,
      }),
    ],
  };
});
