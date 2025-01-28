import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";

import Credentials from "next-auth/providers/credentials";
import authorize from "@/authorize";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL2,
  ssl: {
    rejectUnauthorized: process.env?.POSTGRES_URL2?.indexOf("localhost") === -1,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    GitHub,
    Facebook,
    Google,
    Discord,
    Credentials({
      credentials: {
        username: { label: "Username", type: "text", placeholder: "username" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorize,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      console.log("session", session, token);
      if (!token) return session;
      session.user.admin = token.admin;
      session.user.role = token.role;

      return session;
    },
    async jwt({ token, user }) {
      console.log("jwt", token, user);
      if (user) {
        token.admin = user?.admin;
        token.role = user?.role;
        token.id = user?.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
