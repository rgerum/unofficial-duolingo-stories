import {LoginDialog} from "../components/login";
import Head from "next/head";
import React from "react";

export default function Login() {
    return <>
        <Head>
            <title>Duostories Login</title>
            <link rel="canonical" href={`https://www.duostories.org/login`} />
        </Head>
        <LoginDialog />
    </>
}