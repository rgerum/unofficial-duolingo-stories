import { getServerSession } from "next-auth/next"
import {authOptions} from "pages/api/auth/[...nextauth]";
import React from "react";
import { redirect } from 'next/navigation'
import SignInEmail from "./signin_email";



export default async function Page({ }) {

    const session = await getServerSession(authOptions);

    // If the user is already logged in, redirect.
    // Note: Make sure not to redirect to the same page
    // To avoid an infinite loop!
    if (session) {
        redirect("/");
    }

    return <SignInEmail/>
}
