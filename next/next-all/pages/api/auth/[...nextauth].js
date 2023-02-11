import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import GithubProvider from "next-auth/providers/github"
//import TwitterProvider from "next-auth/providers/twitter"
//import Auth0Provider from "next-auth/providers/auth0"
import DiscordProvider from "next-auth/providers/discord";
// import AppleProvider from "next-auth/providers/apple"
// import EmailProvider from "next-auth/providers/email"

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
  // https://next-auth.js.org/configuration/providers/oauth
  adapter: MyAdapter(),
  providers: [
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
      clientSecret: process.env.GOOGLE_SECRET
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
        console.log(res2);
        if(res2.length === 0) {
          return null
        }
        let user = res2[0];

        let correct = await phpbb_check_hash(credentials.password, user.password);
        console.log("incorrect", correct)
        if (!correct) {
          return null
        }
        console.log("right", correct, user.username)

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
    async jwt({ token, user, account, profile, isNewUser }) {
      console.log("jwt", token, user, account, profile, isNewUser );
      token.userRole = "admin"
      if(user) {
        token.admin = user?.admin;
        token.role = user?.role;
        token.id = user?.id;
      }
      console.log("token", token)
      return token
    }
  }
}

export default NextAuth(authOptions)
