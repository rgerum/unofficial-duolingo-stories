import { getProviders, signIn } from "next-auth/react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../api/auth/[...nextauth]";
import styles from "./register.module.css"
import Head from "next/head";
import React from "react";
import {register, useInput} from "./register";
import Link from "next/link";

export default function Error({ providers }) {


    return (
        <>
            <Head>
                <title>Duostories Login</title>
                <link rel="canonical" href={`https://www.duostories.org/login`} />
            </Head>

            <div id={styles.login_dialog}>
                <div>
                    <h2>Error</h2>
                    <p>
                        An error occurred.
                    </p>

                    <span>Don't have an account? <Link href="/auth/register" className={styles.link}>Sign Up</Link></span>
                </div>
            </div>
        </>
    )
}

export async function getServerSideProps(context) {
    const session = await getServerSession(context.req, context.res, authOptions);

    // If the user is already logged in, redirect.
    // Note: Make sure not to redirect to the same page
    // To avoid an infinite loop!
    if (session) {
        return { redirect: { destination: "/" } };
    }

    const providers = await getProviders();

    return {
        props: { providers: providers ?? [] },
    }
}