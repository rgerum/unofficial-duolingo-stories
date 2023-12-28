import {sql, insert, update} from "./db";

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
      return await insert("user", user, mapping_user);
    },
    async getUser(id) {
      return await (sql
        `SELECT ${getSelectionString(
          mapping_user,
          "u",
        )} FROM "user" u WHERE id = ${id} LIMIT 1;`)[0];
    },
    async getUserByEmail(email) {
      return await (sql
        `SELECT ${getSelectionString(
          mapping_user,
          "u",
        )} FROM "user" u WHERE email = ${email} LIMIT 1;`)[0];
    },
    async getUserByAccount({ providerAccountId, provider }) {
      return await (sql
        `SELECT ${getSelectionString(mapping_user, "u")} FROM "user" u
                            JOIN account a on u.id = a.user_id WHERE a.provider_account_id = ${providerAccountId} AND a.provider = ${provider}
                            LIMIT 1;`)[0];
    },
    async updateUser(user) {
      return update("user", user, mapping_user);
    },
    async deleteUser(userId) {
      await sql`DELETE FROM "user" WHERE id = ${userId}`;
      await sql`DELETE FROM account WHERE user_id = ${userId}`;
      await sql`DELETE FROM session WHERE user_id = ${userId}`;
    },
    async linkAccount(account) {
      return insert("account", account, mapping_account);
    },
    async unlinkAccount({ providerAccountId, provider }) {
      await sql
        `DELETE FROM account WHERE provider_account_id = ${providerAccountId} AND provider = ${provider}`;
    },
    async createSession(session) {
      return insert("session", session, mapping_session);
    },
    async getSessionAndUser(sessionToken) {
      const session = (await sql
        `SELECT ${getSelectionString(
          mapping_session,
          "s",
        )} FROM session s WHERE session_token = ${sessionToken} LIMIT 1`
      )[0];
      if (!session) return null;
      const user = (await sql
        `SELECT ${getSelectionString(
          mapping_user,
          "u",
        )} FROM "user" u WHERE id = ${session.userId} LIMIT 1;`
      )[0];
      return { session, user };
    },
    async updateSession({ sessionToken }) {
      return update("session", sessionToken, mapping_session);
    },
    async deleteSession(sessionToken) {
      await sql`DELETE FROM session WHERE session_token = ${sessionToken}`;
    },
    async createVerificationToken(data) {
      return await insert(
        "verification_token",
        data,
        mapping_verification_token,
      );
    },
    async useVerificationToken({ identifier, token }) {
      let ver_token = (await sql
        `SELECT ${getSelectionString(
          mapping_verification_token,
          "t",
        )} FROM verification_token t WHERE identifier = ${identifier} AND token = ${token} LIMIT 1`
      )[0];
      if (!ver_token) return null;
      await sql`DELETE FROM verification_token WHERE id = ${ver_token.id}`;
      return ver_token;
    },
  };
}
