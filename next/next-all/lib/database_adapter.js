import query from "./db"

function getSelectionString(mapping, pre) {
    let elements = [`${pre}.id`];
    for(let key in mapping) {
        if (key === mapping[key])
            elements.push(`${pre}.${key}`)
        else
            elements.push(`${pre}.${mapping[key]} AS ${key}`)
    }
    return elements.join(", ")
}

export async function update(table_name, data, mapping) {
    let values = [];
    let updates = [];
    for(let key in data) {
        if(mapping[key]) {
            values.push(data[key]);
            updates.push(`${mapping[key]} = ?`);
        }
    }
    values.push(data.id);
    let update_string = updates.join(", ");
    const user_new = await query(`UPDATE ${table_name}
                            SET ${update_string}
                            WHERE id = ?
                            LIMIT 1;`, values);
    return await query_one(`SELECT ${getSelectionString(mapping, "t")} FROM ${table_name} t
                            WHERE id = ?
                            LIMIT 1;`, [data.id]);
}

export async function insert(table_name, data, mapping) {
    console.log("insert", table_name, data, mapping);
    let values = [];
    let columns = [];
    let value_placeholders = [];
    for(let key in data) {
        if(mapping[key]) {
            values.push(data[key]);
            columns.push(`${mapping[key]}`);
            value_placeholders.push(`?`);
        }
    }
    let columns_string = columns.join(", ");
    let value_placeholders_string = value_placeholders.join(", ");
    console.log("insert", `INSERT INTO ${table_name}
                            (${columns_string})
                            VALUES (${value_placeholders_string});`, values)
    const user_new = await query(`INSERT INTO ${table_name}
                            (${columns_string})
                            VALUES (${value_placeholders_string}) ;`, values);
    const id = user_new.insertId;
    console.log("new id");
    return await query_one(`SELECT ${getSelectionString(mapping, "t")} FROM ${table_name} t
                            WHERE id = ?
                            LIMIT 1;`, [id]);
}

async function query_one(query_string, args) {
    const request = await query(query_string, args);
    if (!request.length)
        return null
    return { ...request[0] }
}

let mapping_user = {name: "username", email: "email", emailVerified: "emailVerified", image: "image", admin: "admin", role: "role"};
let mapping_account = {userId: "user_id", type: "type", provider: "provider", providerAccountId: "provider_account_id",
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
}
let mapping_verification_token = {
    identifier: "identifier",
    token: "token",
    expires: "expires",
}
/** @return { import("next-auth/adapters").Adapter } */
export default function MyAdapter() {
    return {
        async createUser(user) {
            console.log("-------- createUser", user);
            return await insert("user", user, mapping_user);
        },
        async getUser(id) {
            console.log("-------- getUser", id);
            return await query_one(`SELECT ${getSelectionString(mapping_user, "u")} FROM user u WHERE id = ? LIMIT 1;`, [id]);
        },
        async getUserByEmail(email) {
            console.log("-------- getUserByEmail", email);
            return await query_one(`SELECT ${getSelectionString(mapping_user, "u")} FROM user u WHERE email = ? LIMIT 1;`, [email]);
        },
        async getUserByAccount({ providerAccountId, provider }) {
            console.log("-------- getUserByAccount", providerAccountId, provider);
            return await query_one(`SELECT ${getSelectionString(mapping_user, "u")} FROM user u
                            JOIN account a on u.id = a.user_id WHERE a.provider_account_id = ? AND a.provider = ?
                            LIMIT 1;`, [providerAccountId, provider]);
        },
        async updateUser(user) {
            console.log("-------- updateUser", user);
            return update("user", user, mapping_user);
        },
        async deleteUser(userId) {
            console.log("-------- deleteUser", userId);
            await query(`DELETE FROM user WHERE id = ?`, [userId]);
            await query(`DELETE FROM account WHERE user_id = ?`, [userId]);
            await query(`DELETE FROM session WHERE user_id = ?`, [userId]);
        },
        async linkAccount(account) {
            console.log("-------- linkAccount", account);
            return insert("account", account, mapping_account);
        },
        async unlinkAccount({ providerAccountId, provider }) {
            await query(`DELETE FROM account WHERE provider_account_id = ? AND provider = ?`, [providerAccountId, provider]);
        },
        async createSession(session) {
            console.log("-------- createSession", session);
            return insert("session", session, mapping_session);
        },
        async getSessionAndUser(sessionToken) {
            console.log("-------- getSessionAndUser", sessionToken);
            const session = await query_one(`SELECT ${getSelectionString(mapping_session, "s")} FROM session s WHERE session_token = ? LIMIT 1`, [sessionToken]);
            if(!session)
                return null
            const user = await query_one(`SELECT ${getSelectionString(mapping_user, "u")} FROM user u WHERE id = ? LIMIT 1;`, [session.userId]);
            return {session, user}
        },
        async updateSession({ sessionToken }) {
            console.log("-------- updateSession", sessionToken);
            return update("session", sessionToken, mapping_session)
        },
        async deleteSession(sessionToken) {
            await query(`DELETE FROM session WHERE session_token = ?`, [sessionToken]);
        },
        async createVerificationToken(data) {
            console.log("-------- createVerificationToken", data)
            return await insert("verification_token", data, mapping_verification_token);
        },
        async useVerificationToken({ identifier, token }) {
            console.log("-------- useVerificationToken", identifier, token)
            let ver_token = await query_one(`SELECT ${getSelectionString(mapping_verification_token, "t")} FROM verification_token t WHERE identifier = ? AND token = ?`, [identifier, token])
            if(!ver_token)
                return null
            await query(`DELETE FROM verification_token WHERE id = ?`, [ver_token.id]);
            return ver_token
        },
    }
}