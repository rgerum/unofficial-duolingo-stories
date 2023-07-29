import { getServerSession } from "next-auth/next"
import {authOptions} from "pages/api/auth/[...nextauth]";
import React from "react";
import { redirect } from 'next/navigation'
import {LoginOptions} from "./login_options";


export default async function Page({ }) {

    const session = await getServerSession(authOptions);

    // If the user is already logged in, redirect.
    // Note: Make sure not to redirect to the same page
    // To avoid an infinite loop!
    if (session) {
        redirect("/");
    }

    let providers = {"email":{"id":"email","name":"Email","type":"email","signinUrl":"http://localhost:3000/api/auth/signin/email","callbackUrl":"http://localhost:3000/api/auth/callback/email"},"facebook":{"id":"facebook","name":"Facebook","type":"oauth","signinUrl":"http://localhost:3000/api/auth/signin/facebook","callbackUrl":"http://localhost:3000/api/auth/callback/facebook"},"github":{"id":"github","name":"GitHub","type":"oauth","signinUrl":"http://localhost:3000/api/auth/signin/github","callbackUrl":"http://localhost:3000/api/auth/callback/github"},"discord":{"id":"discord","name":"Discord","type":"oauth","signinUrl":"http://localhost:3000/api/auth/signin/discord","callbackUrl":"http://localhost:3000/api/auth/callback/discord"},"google":{"id":"google","name":"Google","type":"oauth","signinUrl":"http://localhost:3000/api/auth/signin/google","callbackUrl":"http://localhost:3000/api/auth/callback/google"},"credentials":{"id":"credentials","name":"Credentials","type":"credentials","signinUrl":"http://localhost:3000/api/auth/signin/credentials","callbackUrl":"http://localhost:3000/api/auth/callback/credentials"}}

    return <LoginOptions providers={providers} />
}
