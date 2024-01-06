import { sql } from "./db";

function getSelectionString(mapping, pre) {
  let elements = [`${pre}.id`];
  for (let key in mapping) {
    if (key === mapping[key]) elements.push(`${pre}.${key}`);
    else elements.push(`${pre}.${mapping[key]} AS ${key}`);
  }
  return elements.join(", ");
}

let mapping_user = {
  name: "username",
  email: "email",
  emailVerified: "emailVerified",
  image: "image",
  admin: "admin",
  role: "role",
};
let mapping_account = {
  userId: "user_id",
  type: "type",
  provider: "provider",
  providerAccountId: "provider_account_id",
  refresh_token: "refresh_token",
  access_token: "access_token",
  expires_at: "expires_at",
  token_type: "token_type",
  scope: "scope",
  id_token: "id_token",
  session_state: "session_state",
};
let mapping_session = {
  sessionToken: "session_token",
  userId: "user_id",
  expires: "expires",
};
let mapping_verification_token = {
  identifier: "identifier",
  token: "token",
  expires: "expires",
};
/** @return { import("next-auth/adapters").Adapter } */
export default function MyAdapter() {
  return {
    async createUser(user) {
      return sql`INSERT INTO "user" ${sql({
        username: user.name,
        email: user.email,
        emailverified: user.emailVerified,
        image: user.image,
        admin: user.admin,
        role: user.role,
      })} RETURNING id`;
      //return await insert("user", user, mapping_user);
    },
    async getUser(id) {
      let user = (
        await sql`
SELECT 
  username AS name,
  email,
  emailverified,
  image,
  admin,
  role
FROM "user" WHERE id = ${id} LIMIT 1;`
      )[0];
      user.emailVerified = user.emailverified;
      delete user.emailverified;
    },
    async getUserByEmail(email) {
      let user = (
        await sql`
SELECT 
  username AS name,
  email,
  emailverified,
  image,
  admin,
  role
FROM "user" WHERE email = ${email} LIMIT 1;`
      )[0];
      user.emailVerified = user.emailverified;
      delete user.emailverified;
    },
    async getUserByAccount({ providerAccountId, provider }) {
      let user = (
        await sql`
SELECT 
  username AS name,
  email,
  emailverified,
  image,
  admin,
  role
FROM "user"
JOIN account ON "user".id = account.user_id
 WHERE account.provider_account_id = ${providerAccountId} AND account.provider = ${provider}
LIMIT 1;`
      )[0];
      user.emailVerified = user.emailverified;
      delete user.emailverified;
    },
    async updateUser(user) {
      return sql`
update "user" set ${sql({
        username: user.name,
        email: user.email,
        emailverified: user.emailVerified,
        image: user.image,
        admin: user.admin,
        role: user.role,
      })}
where user_id = ${user.id}
`;
    },
    async deleteUser(userId) {
      await sql`DELETE FROM "user" WHERE id = ${userId}`;
      await sql`DELETE FROM account WHERE user_id = ${userId}`;
      await sql`DELETE FROM session WHERE user_id = ${userId}`;
    },
    async linkAccount(account) {
      return sql`INSERT INTO account ${sql({
        user_id: account.userId,
        type: account.type,
        provider: account.provider,
        provider_account_id: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      })} RETURNING id`;
      //return insert("account", account, mapping_account);
    },
    async unlinkAccount({ providerAccountId, provider }) {
      await sql`DELETE FROM account WHERE provider_account_id = ${providerAccountId} AND provider = ${provider}`;
    },
    async createSession(session) {
      return sql`INSERT INTO session ${sql({
        session_token: session.sessionToken,
        user_id: session.userId,
        expires: session.expires,
      })} RETURNING id`;
      //return insert("session", session, mapping_session);
    },
    async getSessionAndUser(sessionToken) {
      const session = (
        await sql`SELECT 
        session_toke,
        user_id,
        expires FROM session s WHERE session_token = ${sessionToken} LIMIT 1`
      )[0];
      if (!session) return null;
      session.sessionToken = session.session_token;
      delete session.session_token;
      session.userId = session.user_id;
      delete session.user_id;

      const user = (
        await sql`SELECT  
        username AS name,
        email,
        emailverified,
        image,
        admin,
        role 
        FROM "user" WHERE id = ${session.userId} LIMIT 1;`
      )[0];
      user.emailVerified = user.emailverified;
      delete user.emailverified;
      return { session, user };
    },
    async updateSession({ sessionToken }) {
      return sql`
      update session set ${sql({
        session_token: sessionToken.sessionToken,
        user_id: sessionToken.userId,
        expires: sessionToken.expires,
      })}
      where session_token = ${sessionToken.sessionToken}
`;
      //return update("session", sessionToken, mapping_session);
    },
    async deleteSession(sessionToken) {
      await sql`DELETE FROM session WHERE session_token = ${sessionToken}`;
    },
    async createVerificationToken(data) {
      return sql`INSERT INTO verification_token ${sql({
        identifier: data.identifier,
        token: data.token,
        expires: data.expires,
      })} RETURNING id`;
      //return await insert(
      //  "verification_token",
      //  data,
      //  mapping_verification_token,
      //);
    },
    async useVerificationToken({ identifier, token }) {
      let ver_token = (
        await sql`SELECT identifier, token, expires
 FROM verification_token
 WHERE identifier = ${identifier} AND token = ${token} LIMIT 1`
      )[0];
      if (!ver_token) return null;
      await sql`DELETE FROM verification_token WHERE id = ${ver_token.id}`;
      return ver_token;
    },
  };
}
