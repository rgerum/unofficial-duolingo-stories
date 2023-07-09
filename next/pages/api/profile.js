// This is an example of how to read a JSON Web Token from an API route
import { getToken } from "next-auth/jwt"
import {getCsrfToken, getProviders, getSession} from "next-auth/react";
import query from "../../lib/db";
//import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
    return undefined;


        const session = await getServerSession(req, res, authOptions)

    // If you don't have NEXTAUTH_SECRET set, you will have to pass your secret as `secret` to `getToken`
    const providers = await getProviders()
    console.log("Providers", providers)
    const token = await getToken({ req })
    const req2 = await query(`SELECT provider FROM account WHERE user_id = ?`, [token.id]);
    console.log(providers);
    console.log(req2);
    console.log("session", session);
    if (token) {
        // Signed in
        console.log("JSON Web Token", JSON.stringify(token, null, 2))
    } else {
        // Not Signed in
        res.status(401)
    }
    res.end()
}

export async function getLinkedProviders(req) {
    let providers_base = ['facebook', 'github', 'google', 'discord'];
    const token = await getToken({ req })
    const req2 = await query(`SELECT provider FROM account WHERE user_id = ?`, [token.id]);

    let provider_linked = {};
    for(let p of providers_base) {
        provider_linked[p] = false;
    }
    let providers = [];
    for(let p of req2) {
        providers.push(p.provider)
        provider_linked[p.provider] = true;
    }
    let role = [];
    if(token.admin)
        role.push("Admin")
    if(token.role)
        role.push("Contributor")
    console.log("token", token, role)
    console.log("providers", providers)
    return {providers, name: token.name, email: token.email, role: role, provider_linked};
}