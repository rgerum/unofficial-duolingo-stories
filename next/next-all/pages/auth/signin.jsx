import { getProviders, signIn } from "next-auth/react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../api/auth/[...nextauth]";
import styles from "./register.module.css"
import Head from "next/head";
import React from "react";
import {register, useInput} from "./register";
import Link from "next/link";
import {useRouter} from "next/router";

export default function SignIn({ providers }) {
    let [usernameInput, usernameInputSetValue] = useInput("");
    let [passwordInput, passwordInputSetValue] = useInput("");
    let [emailInput, emailInputSetValue] = useInput("");

    async function register_button() {
        await signIn("credentials", { username: usernameInput, password: passwordInput })
    }

    const handleKeypressSignup = e => {
        // listens for enter key
        if (e.keyCode === 13) {
            register_button();
        }
    };

    async function register_button2() {
        await signIn("email", { email: emailInput})
    }

    const handleKeypressSignup2 = e => {
        // listens for enter key
        if (e.keyCode === 13) {
            register_button2();
        }
    };

    let error_codes = {
        "OAuthSignin": "Try signing in with a different account.",
        "OAuthCallback": "Try signing in with a different account.",
        "OAuthCreateAccount": "Try signing in with a different account.",
        "EmailCreateAccount": "Try signing in with a different account.",
        "Callback": "Try signing in with a different account.",
        "OAuthAccountNotLinked": "To confirm your identity, sign in with the same account you used originally.",
        "EmailSignin": "The e-mail could not be sent.",
        "CredentialsSignin": "Sign in failed. Check the details you provided are correct.",
        "SessionRequired": "Please sign in to access this page.",
        "Default": "Unable to sign in."}
    const router = useRouter();
    let error = error_codes[router.query["error"]];


    return (
        <>
            <Head>
                <title>Duostories Login</title>
                <link rel="canonical" href={`https://www.duostories.org/login`} />
            </Head>

            <div id={styles.login_dialog}>
                <Link href="/" id={styles.quit}></Link>
                <div>
                    <h2>Log in</h2>
                    <p>{error}
                        Attention, you cannot login with your Duolingo account.
                    </p>
                    <p>
                        You have to register for the unofficial stories separately, as they are an independent project.
                    </p>
                    {error ? <span className={styles.error}>{error}</span> : <></>}
                    <input data-cy="username" value={usernameInput} onChange={usernameInputSetValue} type="text" name="username"
                           placeholder="Username"/>
                    <input data-cy="password" value={passwordInput} onChange={passwordInputSetValue} onKeyDown={handleKeypressSignup} type="password" name="password"
                           placeholder="Password"/>
                    <button data-cy="submit"  className={styles.button}
                            onClick={register_button}>{ "Log in" }</button>
                    <span>Don't have an account? <Link href="/auth/register" className={styles.link}>Sign Up</Link></span>
                    <hr/>
                    {/*<input data-cy="email" value={emailInput} onChange={emailInputSetValue} onKeyDown={handleKeypressSignup2} type="email" placeholder="Email" name="email"/>
                    <button data-cy="submit"  className={styles.button}
                            onClick={register_button2}>{ "Log in with email" }</button>

                    <hr/>*/}
                    {Object.values(providers).map((provider) => ( (provider.id !== "email" && provider.id !== "credentials") ?
                    <button className={styles.button2} onClick={() => signIn(provider.id)}>
                        <img loading="lazy" id="provider-logo" src={`https://authjs.dev/img/providers/${provider.id}.svg`} width="24" height="24"/>
                        <span>{provider.name}</span>
                    </button>
                    : <></>
            ))}
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

    return {
        props: { providers: {"email":{"id":"email","name":"Email","type":"email","signinUrl":"http://localhost:3000/api/auth/signin/email","callbackUrl":"http://localhost:3000/api/auth/callback/email"},"facebook":{"id":"facebook","name":"Facebook","type":"oauth","signinUrl":"http://localhost:3000/api/auth/signin/facebook","callbackUrl":"http://localhost:3000/api/auth/callback/facebook"},"github":{"id":"github","name":"GitHub","type":"oauth","signinUrl":"http://localhost:3000/api/auth/signin/github","callbackUrl":"http://localhost:3000/api/auth/callback/github"},"discord":{"id":"discord","name":"Discord","type":"oauth","signinUrl":"http://localhost:3000/api/auth/signin/discord","callbackUrl":"http://localhost:3000/api/auth/callback/discord"},"google":{"id":"google","name":"Google","type":"oauth","signinUrl":"http://localhost:3000/api/auth/signin/google","callbackUrl":"http://localhost:3000/api/auth/callback/google"},"credentials":{"id":"credentials","name":"Credentials","type":"credentials","signinUrl":"http://localhost:3000/api/auth/signin/credentials","callbackUrl":"http://localhost:3000/api/auth/callback/credentials"}} },
    }
    const providers = await getProviders();

    return {
        props: { providers: providers ?? [] },
    }
}