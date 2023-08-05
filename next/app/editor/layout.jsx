import {authOptions} from "app/api/auth/[...nextauth]/route";
import React from "react";
import {getServerSession} from "next-auth/next";
import {redirect} from "next/navigation";


export default async function Layout({ children }) {
    const session = await getServerSession(authOptions);

    if(!session?.user?.role)
        redirect('/auth/editor');

    return (
    <>{children}</>
    )
}