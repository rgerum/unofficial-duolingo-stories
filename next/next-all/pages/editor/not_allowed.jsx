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
                    <h2>Not Allowed</h2>
                    <p>
                        Your do not have access to the editor.
                    </p>
                    <p>
                        If you want to contribute ask us on <Link href="https://discord.gg/4NGVScARR3">Discord</Link>.
                    </p>
                    <p>
                        You might need to login and out again after you got access to the editor.
                    </p>
                </div>
            </div>
        </>
    )
}
