"use server"
import {signIn} from "@/auth";

export default async function signIn_cred(provider: string, args?: {username?: string, password?: string}
) {
    return await signIn(provider, args);
}
