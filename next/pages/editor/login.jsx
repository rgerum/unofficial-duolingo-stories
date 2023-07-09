import { signIn } from "next-auth/react"
import styles from "../auth/register.module.css"
import Head from "next/head";
import React from "react";
import Link from "next/link";


export default function SignIn() {

    return (
        <>
            <Head>
                <title>Duostories Login</title>
                <link rel="canonical" href={`https://www.duostories.org/login`} />
            </Head>

            <div id={styles.login_dialog}>
                <Link href="/" id={styles.quit}></Link>
                <div>
                    <h2>Not Logged in</h2>
                    <p>
                        You need to be logged in with an account that has a contributor  role.
                    </p>
                    <button data-cy="submit"  className={styles.button}
                            onClick={signIn}>{ "Log in" }</button>
                </div>
            </div>
        </>
    )
}
