import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";

import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "@neondatabase/serverless";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  // Create a `Pool` inside the request handler.
  const pool = new Pool({ connectionString: process.env.POSTGRES_URL2 });
  return {
    adapter: PostgresAdapter(pool),
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
        authorize: async (credentials) => {
          return { username: credentials.username, role: true, admin: true };
        },
      }),
    ],
    pages: {
      signIn: "/auth/signin",
    },
  };
});
