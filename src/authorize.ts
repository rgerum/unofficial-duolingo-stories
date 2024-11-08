"use server"
import {sql} from "@/lib/db";
import {phpbb_check_hash} from "@/lib/auth/hash_functions2";

export default async function authorize (credentials: {username: string, password: string}) {
    let res2 =
        await sql`SELECT * FROM users WHERE LOWER(name) = ${credentials.username.toLowerCase()} AND activated`;
    if (res2.length === 0) {
        return null;
    }
    let user = res2[0];

    let correct = phpbb_check_hash(credentials.password, user.password);
    if (!correct) {
        return null;
    }

    return {
        name: user.name,
        email: user.email,
        id: user.id,
        user_id: user.id,
        role: user.role,
        admin: user.admin,
    };
}