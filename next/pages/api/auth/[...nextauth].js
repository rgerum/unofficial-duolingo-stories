import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import GithubProvider from "next-auth/providers/github"
//import TwitterProvider from "next-auth/providers/twitter"
//import Auth0Provider from "next-auth/providers/auth0"
import DiscordProvider from "next-auth/providers/discord";
// import AppleProvider from "next-auth/providers/apple"
import EmailProvider from "next-auth/providers/email"

import CredentialsProvider from "next-auth/providers/credentials"
import query from "../../../lib/db"
import {phpbb_check_hash} from "../../../lib/auth/hash_functions2";
import MyAdapter from "../../../lib/database_adapter";

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/auth/signin',
    //signOut: '/auth/signout',
    //error: '/auth/error', // Error code passed in query string as ?error=
    //verifyRequest: '/auth/verify-request', // (used for check email message)
    //newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
  },
  // https://next-auth.js.org/configuration/providers/oauth
  adapter: MyAdapter(),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM
    }),
    /* EmailProvider({
         server: process.env.EMAIL_SERVER,
         from: process.env.EMAIL_FROM,
       }),
    // Temporarily removing the Apple provider from the demo site as the
    // callback URL for it needs updating due to Vercel changing domains

    Providers.Apple({
      clientId: process.env.APPLE_ID,
      clientSecret: {
        appleId: process.env.APPLE_ID,
        teamId: process.env.APPLE_TEAM_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY,
        keyId: process.env.APPLE_KEY_ID,
      },
    }),
    */
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      authorizationUrl:
          'https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&access_type=offline&response_type=code',
      scope:
          'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/youtube.readonly',
    }),
    /*TwitterProvider({
      clientId: process.env.TWITTER_ID,
      clientSecret: process.env.TWITTER_SECRET
    }),
    Auth0Provider({
      clientId: process.env.AUTH0_ID,
      clientSecret: process.env.AUTH0_SECRET,
      issuer: process.env.AUTH0_ISSUER
    }),*/
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "username" },
        password: {  label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        let res2 = await query(`SELECT * FROM user WHERE username = ? AND activated = 1`, credentials.username);
        if(res2.length === 0) {
          return null
        }
        let user = res2[0];

        let correct = await phpbb_check_hash(credentials.password, user.password);
        if (!correct) {
          return null
        }

        return {
          name: user.username,
          email: user.email,
          id: user.id,
          user_id: user.id,
          role: user.role,
          admin: user.admin,
        }
      }
    })
  ],
  theme: {
    colorScheme: "light"
  },
  callbacks: {
    async session({ session, token, user }) {
      session.user.admin = token.admin
      session.user.role = token.role

      return session
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if(user) {
        token.admin = user?.admin;
        token.role = user?.role;
        token.id = user?.id;
      }
      return token
    }
  }
}

export default NextAuth(authOptions)
