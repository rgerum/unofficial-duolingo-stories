import { sql } from "./db.ts";

/** @return { import("next-auth/adapters").Adapter } */
export default function MyAdapter() {
  return {
    async createUser(user) {
      //console.log("createUser", user);
      const { name, email, emailVerified, image } = user;

      const result = await sql`INSERT INTO "users" ${sql({
        name: name,
        email: email,
        emailVerified: emailVerified,
        image: image,
      })} RETURNING id, name, email, "emailVerified", image`;
      //console.log("return", result[0]);
      return result[0];
    },
    async getUser(id) {
      //console.log("getUser", id);
      try {
        const result =
          await sql`select id, name, email,  "emailVerified", image, admin, role from "users" where id = ${id}`;
        //console.log("return", result.length !== 0 ? result[0] : null);
        return result.length === 0 ? null : result[0];
      } catch (e) {
        return null;
      }
    },
    async getUserByEmail(email) {
      //console.log("getUserByEmail", email);
      try {
        const result =
          await sql`select id, name, email, "emailVerified", image, admin, role from "users" where email = ${email}`;
        //console.log("return", result.length !== 0 ? result[0] : null);
        return result.length === 0 ? null : result[0];
      } catch (e) {
        return null;
      }
    },
    async getUserByAccount({ providerAccountId, provider }) {
      //console.log("getUserByAccount", providerAccountId, provider);
      let result = await sql`
SELECT 
    "users".id, name, email, "emailVerified", image, admin, role 
FROM "users"
JOIN accounts ON "users".id = accounts."userId"
 WHERE accounts."providerAccountId" = ${providerAccountId} AND accounts.provider = ${provider}
LIMIT 1;`;
      //console.log("return", result.length !== 0 ? result[0] : null);
      return result.length !== 0 ? result[0] : null;
    },
    async updateUser(user) {
      //console.log("updateUser", user);
      let query1 = await sql`SELECT * FROM "users" WHERE id = ${user.id}`;
      let oldUser = query1[0];

      if (user.name !== undefined) oldUser.name = user.name;
      if (user.email !== undefined) oldUser.email = user.email;
      if (user.emailVerified !== undefined)
        oldUser.emailverified = user.emailVerified;
      if (user.image !== undefined) oldUser.image = user.image;
      if (user.admin !== undefined) oldUser.admin = user.admin;
      if (user.role !== undefined) oldUser.role = user.role;

      const query2 = await sql`update "users" set ${sql(oldUser)} where id = ${
        user.id
      } RETURNING id, username AS name, email, emailverified AS "emailVerified", image, admin, role`;
      return query2[0];
    },
    async deleteUser(userId) {
      //console.log("deleteUser");
      await sql`DELETE FROM "users" WHERE id = ${userId}`;
      await sql`DELETE FROM accounts WHERE "userId" = ${userId}`;
      await sql`DELETE FROM sessions WHERE "userId" = ${userId}`;
    },
    async linkAccount(account) {
      //console.log("linkAccount", account);
      ////console.log("linkAccount", account);
      let d = {
        userId: account.userId,
        provider: account.provider,
        type: account.type,
        providerAccountId: account.providerAccountId,
        access_token: account.access_token || null,
        expires_at: account.expires_at || null,
        refresh_token: account.refresh_token || null,
        id_token: account.id_token || null,
        scope: account.scope || null,
        session_state: account.session_state || null,
        token_type: account.token_type || null,
      };
      //console.log(d);
      let result = await sql`INSERT INTO accounts ${sql(
        d,
      )} RETURNING id, "userId", provider, type, "providerAccountId", access_token, expires_at, refresh_token, id_token, scope, session_state, token_type`;
      //console.log("result", result[0]);
      return result[0];
      //return insert("account", account, mapping_account);
    },
    async unlinkAccount({ providerAccountId, provider }) {
      //console.log("unlinkAccount", providerAccountId, provider);
      await sql`DELETE FROM accounts WHERE "providerAccountId" = ${providerAccountId} AND provider = ${provider}`;
    },
    async createSession(session) {
      //console.log("createSession", session);
      return (
        await sql`INSERT INTO sessions ${sql({
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        })} RETURNING id, "sessionToken", "userId", expires`
      )[0];
      //return insert("session", session, mapping_session);
    },
    async getSessionAndUser(sessionToken) {
      //console.log("getSessionAndUser", sessionToken);
      if (sessionToken === undefined) return null;
      const session = (
        await sql`SELECT 
        "sessionToken",
        "userId",
        expires FROM sessions s WHERE "sessionToken" = ${sessionToken} LIMIT 1`
      )[0];
      if (!session) return null;

      const user = (
        await sql`SELECT  
        name,
        email,
        "emailVerified",
        image,
        admin,
        role 
        FROM "users" WHERE id = ${session.userId} LIMIT 1;`
      )[0];
      return { session, user };
    },
    async updateSession(session) {
      //console.log("updateSession", session);
      let sessionOld = (
        await sql`SELECT * FROM sessions WHERE "sessionToken" = ${session.sessionToken}`
      )[0];
      if (!sessionOld) return null;
      if (session.expires !== undefined) sessionOld.expires = session.expires;
      return sql`
      update sessions set ${sql(sessionOld)}
      where "sessionToken" = ${session.sessionToken}
`;
    },
    async deleteSession(sessionToken) {
      //console.log("deleteSession", sessionToken);
      await sql`DELETE FROM sessions WHERE "sessionToken" = ${sessionToken}`;
    },
    async createVerificationToken(verificationToken) {
      //console.log("createVerificationToken", verificationToken);
      const { identifier, expires, token } = verificationToken;
      await sql`INSERT INTO verification_token ${sql({
        identifier,
        expires,
        token,
      })} RETURNING id`;
      return verificationToken;
    },
    async useVerificationToken({ identifier, token }) {
      //console.log("useVerificationToken", identifier, token);
      const result = await sql`DELETE FROM verification_token
      where identifier = ${identifier} and token = ${token}
      RETURNING identifier, expires, token `;
      return result.length !== 0 ? result[0] : null;
    },
  };
}
