//import {LoginDialog} from "../components/login";
import Head from "next/head";
import React from "react";
import styles from "./register.module.css"
import Link from "next/link";

export function useInput(def) {
    let [value, setValue] = React.useState(def);
    function set(e) {
        let v = e?.target ? e?.target?.value : e;
        if (v === null || v === undefined)
            v = "";
        setValue(v);
    }
    return [value, set];
} // Hook

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

export async function register(data) {
    console.log("register")
    // register a new user
    let response;
    try {
        response = await fetch_post(`/api/user/register`, data)
    }
        // something wrong :-(
    catch (e) {
        console.log(e);
        return [false, "Something went wrong."];
    }
    // not allowed? perhaps the username is already taken
    if(response.status === 403) {
        let text = await response.text();
        return [false, text];
    }
    // again something wrong?
    else if(response.status !== 200) {
        return [false, "Something went wrong."];
    }
    // everything ok!
    return [true, ""];
}


export default function Register() {
    // <LoginDialog />
    let [showLogin, setShowLogin] = React.useState(0);

    let [state, setState] = React.useState(0);
    let [error, setError] = React.useState("");
    let [message, setMessage] = React.useState("");

    let [usernameInput, usernameInputSetValue] = useInput("");
    let [passwordInput, passwordInputSetValue] = useInput("");
    let [emailInput, emailInputSetValue] = useInput("");

    let [remember, setRememberX] = React.useState(false);

    async function register_button() {
        const emailValidation = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
        if (!emailValidation.test(emailInput)) {
            let msg = "Not a valid email, please try again."
            setError(msg);
            setState(-1)

        } else if (!passwordInput) {
            setState(-1)
            setError("Please enter a password")
        } else {
            setState(1);
            let [success, msg] = await register({username: usernameInput, password: passwordInput, email: emailInput});

            if(success === false) {
                if(msg === "")
                    msg = "Something went wrong."
                setError(msg);
                setState(-1);
            }
            else {
                setState(2);
                setMessage("Your account has been registered. An e-mail with an activation link has been sent to you. Please click on the link in the e-mail to proceed. You may need to look into your spam folder.");
            }
        }
    }
    const handleKeypressSignup = e => {
        // listens for enter key
        if (e.keyCode === 13) {
            register_button();
        }
    };

    return <>
        <Head>
            <title>Duostories Login</title>
            <link rel="canonical" href={`https://www.duostories.org/login`} />
        </Head>

        <div id={styles.login_dialog}>
            <Link href="/" id={styles.quit}></Link>
            <div>
                <h2>Sign up</h2>
                <p>If you register you can keep track of the stories you have already finished.</p>
                <p>Registration is optional, stories can be accessed even without login.</p>
                <input data-cy="username" value={usernameInput} onChange={usernameInputSetValue} type="text"
                       placeholder="Username"/>
                <input data-cy="email" value={emailInput} onChange={emailInputSetValue} onKeyDown={handleKeypressSignup} type="email" placeholder="Email"/>
                <input data-cy="password" value={passwordInput} onChange={passwordInputSetValue} onKeyDown={handleKeypressSignup} type="password"
                       placeholder="Password"/>
                {state === -1 ?
                    <span className="login_error" data-cy="login_error">{error}</span> : null }
                {state === 2 ?
                    <span>{message}</span> :
                    <button data-cy="submit"  className={styles.button}
                            onClick={register_button}>{state !== 1 ? "Sign up" : "..."}</button>
                }
                <p>Already have an account? <Link className={styles.link} href="/api/auth/signin">LOG IN</Link></p>
            </div>
        </div>
    </>
}