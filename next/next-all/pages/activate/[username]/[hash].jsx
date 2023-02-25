import Head from "next/head";
import React from "react";
import Link from "next/link";
import {activate} from "../../api/user/activate";

export async function activateX(data) {
    let response = await fetch_post(`/api/user/activate`, data);
    return response.status === 200;
}

export async function fetch_post(url, data)
{
    // check if the user is logged in
    var req = new Request(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        mode: "cors",
        credentials: 'include',
    });
    return fetch(req);
}

export default function UserActivationOrReset({activated, username, hash}) {
    console.log("UserActivationOrReset", activated, username, hash);
    return <>
        <Head>
            <link rel="canonical" href={`https://www.duostories.org/activate/${username}/${hash}`} />
        </Head>
        <div id="login_dialog">
            <div>
                <h2>Activate account</h2>
                {activated === 0 ?
                    <p id="status">activating account...</p>
                    : activated === "done" ?
                        <>
                            <p id="status">Activation successful.</p>
                            <p id="login_form">
                                {/* Use of absolute link because relative links would only be relative to carex.uber.space */}
                                You can now <Link href='/api/auth/signin'>log in</Link>.
                            </p>
                        </>
                        :
                        <p id="status">Activation not successful.</p>
                }
            </div>
        </div>
    </>
}

export async function getServerSideProps({params}) {
    return { props: {activated: 0, ...params}}
    let activated = await activate(params);
    return { props: {activated, ...params}}
}