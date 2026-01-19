import { sql } from "./db";
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from "@auth/core/adapters";

// Extended user type with custom fields used in this app
interface ExtendedAdapterUser extends AdapterUser {
  admin?: boolean;
  role?: string;
}

export default function MyAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      //console.log("createUser", user);
      const { name, email, emailVerified, image } = user;

      const result = await sql`INSERT INTO "users" ${sql({
        name: name,
        email: email,
        emailVerified: emailVerified,
        image: image,
      })} RETURNING id, name, email, "emailVerified", image`;
      //console.log("return", result[0]);
      return result[0] as AdapterUser;
    },
    async getUser(id: string): Promise<AdapterUser | null> {
      //console.log("getUser", id);
      try {
        const result =
          await sql`select id, name, email,  "emailVerified", image, admin, role from "users" where id = ${id}`;
        //console.log("return", result.length !== 0 ? result[0] : null);
        return result.length === 0 ? null : (result[0] as AdapterUser);
      } catch (e) {
        return null;
      }
    },
    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      //console.log("getUserByEmail", email);
      try {
        const result =
          await sql`select id, name, email, "emailVerified", image, admin, role from "users" where email = ${email}`;
        //console.log("return", result.length !== 0 ? result[0] : null);
        return result.length === 0 ? null : (result[0] as AdapterUser);
      } catch (e) {
        return null;
      }
    },
    async getUserByAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }): Promise<AdapterUser | null> {
      //console.log("getUserByAccount", providerAccountId, provider);
      let result = await sql`
SELECT 
    "users".id, name, email, "emailVerified", image, admin, role 
FROM "users"
JOIN accounts ON "users".id = accounts."userId"
 WHERE accounts."providerAccountId" = ${providerAccountId} AND accounts.provider = ${provider}
LIMIT 1;`;
      //console.log("return", result.length !== 0 ? result[0] : null);
      return result.length !== 0 ? (result[0] as AdapterUser) : null;
    },
    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, "id">): Promise<AdapterUser> {
      //console.log("updateUser", user);
      const extUser = user as Partial<ExtendedAdapterUser> & Pick<AdapterUser, "id">;
      let query1 = await sql`SELECT * FROM "users" WHERE id = ${extUser.id}`;
      let oldUser = query1[0];

      if (extUser.name !== undefined) oldUser.name = extUser.name;
      if (extUser.email !== undefined) oldUser.email = extUser.email;
      if (extUser.emailVerified !== undefined)
        oldUser.emailverified = extUser.emailVerified;
      if (extUser.image !== undefined) oldUser.image = extUser.image;
      if (extUser.admin !== undefined) oldUser.admin = extUser.admin;
      if (extUser.role !== undefined) oldUser.role = extUser.role;

      const query2 = await sql`update "users" set ${sql(oldUser)} where id = ${
        user.id
      } RETURNING id, username AS name, email, emailverified AS "emailVerified", image, admin, role`;
      return query2[0] as AdapterUser;
    },
    async deleteUser(userId: string): Promise<void> {
      //console.log("deleteUser");
      await sql`DELETE FROM "users" WHERE id = ${userId}`;
      await sql`DELETE FROM accounts WHERE "userId" = ${userId}`;
      await sql`DELETE FROM sessions WHERE "userId" = ${userId}`;
    },
    async linkAccount(account: AdapterAccount): Promise<AdapterAccount> {
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
      return result[0] as AdapterAccount;
      //return insert("account", account, mapping_account);
    },
    async unlinkAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }): Promise<void> {
      //console.log("unlinkAccount", providerAccountId, provider);
      await sql`DELETE FROM accounts WHERE "providerAccountId" = ${providerAccountId} AND provider = ${provider}`;
    },
    async createSession(session: { sessionToken: string; userId: string; expires: Date }): Promise<AdapterSession> {
      //console.log("createSession", session);
      return (
        await sql`INSERT INTO sessions ${sql({
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        })} RETURNING id, "sessionToken", "userId", expires`
      )[0] as AdapterSession;
      //return insert("session", session, mapping_session);
    },
    async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
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
      return { session: session as AdapterSession, user: user as AdapterUser };
    },
    async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">): Promise<AdapterSession | null | undefined> {
      //console.log("updateSession", session);
      let sessionOld = (
        await sql`SELECT * FROM sessions WHERE "sessionToken" = ${session.sessionToken}`
      )[0];
      if (!sessionOld) return null;
      if (session.expires !== undefined) sessionOld.expires = session.expires;
      await sql`
      update sessions set ${sql(sessionOld)}
      where "sessionToken" = ${session.sessionToken}
`;
      return sessionOld as AdapterSession;
    },
    async deleteSession(sessionToken: string): Promise<void> {
      //console.log("deleteSession", sessionToken);
      await sql`DELETE FROM sessions WHERE "sessionToken" = ${sessionToken}`;
    },
    async createVerificationToken(verificationToken: VerificationToken): Promise<VerificationToken> {
      //console.log("createVerificationToken", verificationToken);
      const { identifier, expires, token } = verificationToken;
      await sql`INSERT INTO verification_token ${sql({
        identifier,
        expires,
        token,
      })} RETURNING id`;
      return verificationToken;
    },
    async useVerificationToken({ identifier, token }: { identifier: string; token: string }): Promise<VerificationToken | null> {
      //console.log("useVerificationToken", identifier, token);
      const result = await sql`DELETE FROM verification_token
      where identifier = ${identifier} and token = ${token}
      RETURNING identifier, expires, token `;
      return result.length !== 0 ? (result[0] as VerificationToken) : null;
    },
  };
}
