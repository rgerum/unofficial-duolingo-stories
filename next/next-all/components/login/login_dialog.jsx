import React from 'react';
import Link from "next/link";
import {useRouter} from "next/router";

import styles from './login.module.css';

import {register, reset_pw} from "./api_calls/user";
import {useUser} from "../../lib/hooks";
import {useInput} from "../../lib/hooks";
import {signIn, useSession} from "next-auth/react";

import dynamic from "next/dynamic";

const LoggedInButton = dynamic(() => import("./loggedinbutton"), {
    ssr: false,
});

export default function Login({page}) {
    //const { userdata } = useUser();
    const { data: session } = useSession();
    if(!page)
        page = "stories";

    if(session?.user.name !== undefined)
        return <LoggedInButton page={page}/>

    return <button onClick={() => signIn()} className={styles.button} style={{float: "none"}}>Log in</button>
}

export function LoginDialog({page}) {
    const { userdata, login } = useUser();

    let [showLogin, setShowLogin] = React.useState(0);

    let [state, setState] = React.useState(0);
    let [error, setError] = React.useState("");
    let [message, setMessage] = React.useState("");

    let [usernameInput, usernameInputSetValue] = useInput("");
    let [passwordInput, passwordInputSetValue] = useInput("");
    let [emailInput, emailInputSetValue] = useInput("");

    let [remember, setRememberX] = React.useState(false);

    const router = useRouter();

    //document.title = `Duostories Login`;

    function doSetShowLogin(value) {
        setShowLogin(value);
        setState(0);
        setError("");
        setMessage("");
    }

    function setRemember(e) {
        setRememberX(e.target.checked);
    }

    async function buttonLogin() {
        setState(1);
        let userdata_new;
        try {
            userdata_new = await login(usernameInput, passwordInput, remember);
        }
        catch (e) {
            console.log(e);
            setError("Something went wrong.");
            setState(-1);
            return;
        }
        if(userdata_new.username === undefined) {
            setError("Wrong username or password. Try again.");
            setState(-1);
        }
        else {
            setState(0);
            //setShowLogin(0);
            router.push("/");
        }
    }
    const handleKeypressLogin = e => {
        // listens for enter key
        if (e.keyCode === 13) {
            buttonLogin();
        }
    };
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
    async function reset_button() {
        setState(1);
        let [success, msg] = await reset_pw({username: usernameInput});

        if(success === false) {
            if(msg === "")
                msg = "Something went wrong."
            setError(msg);
            setState(-1);
        }
        else {
            setState(2);
            setMessage("Have received an email with a reset link. You may need to look into your spam folder.");
        }
    }

    if(page === "editor") {
        return <>
            {userdata.username === undefined ?
                <div className={styles.login_dialog} >
                    <div>
                        <h2>Editor Log in</h2>
                        <p>You need an account that has been activated as a contributor.</p>
                        <input value={usernameInput} onChange={usernameInputSetValue} onKeyDown={handleKeypressLogin}
                               data-cy="username" type="text" placeholder="Username"/>
                        <input value={passwordInput} onChange={passwordInputSetValue} onKeyDown={handleKeypressLogin}
                               data-cy="password" type="password" placeholder="Password"/>
                        {state === -1 ? <><span className={styles.login_error} data-cy="login_error">{error}</span><br/></> : null}
                        <span><input type="checkbox" checked={remember}
                                     onChange={setRemember}/> keep me logged in</span>
                        <button className={styles.login_dialog_button} onClick={buttonLogin} data-cy="submit">{state !== 1 ? "Log in" : "..."}</button>
                    </div>
                </div>
                :
                <div className={styles.login_dialog}>
                    <div>
                        <h2>Not allowed</h2>
                        <img alt={"sad duo"} width="80p" src="https://design.duolingo.com/28e4b3aebfae83e5ff2f.svg" /><br/>
                        <p>You need to have permissions<br/>to access the editor.<br/></p>
                        <p>If wou want to contribute,<br/>you can talk to us on <Link href="https://discord.gg/4NGVScARR3">Discord</Link>.</p>
                        <p><button className={styles.link} data-cy="back" onClick={()=>userdata.logout()} >BACK</button></p>
                    </div>
                </div>
            }
        </>
    }
    if(page === "admin") {
        return <>
            {userdata.username === undefined ?
                <div className={styles.login_dialog} >
                    <div>
                        <h2>Admin Panel Log in</h2>
                        <p>You need an admin account to login here.</p>
                        <input value={usernameInput} onChange={usernameInputSetValue} onKeyDown={handleKeypressLogin}
                               data-cy="username" type="text" placeholder="Username"/>
                        <input value={passwordInput} onChange={passwordInputSetValue} onKeyDown={handleKeypressLogin}
                               data-cy="password" type="password" placeholder="Password"/>
                        {state === -1 ? <><span className={styles.login_error} data-cy="login_error">{error}</span><br/></> : null}
                        <span><input type="checkbox" checked={remember}
                                     onChange={setRemember}/> keep me logged in</span>
                        <button data-cy="submit" className={styles.login_dialog_button} onClick={buttonLogin}>{state !== 1 ? "Log in" : "..."}</button>
                    </div>
                </div>
                :
                <div className={styles.login_dialog}>
                    <div>
                        <h2>Not allowed</h2>
                        <img alt={"sad duo"} width="80p" src="https://design.duolingo.com/28e4b3aebfae83e5ff2f.svg" /><br/>
                        <p>You need to have permissions<br/>to access the admin panel.<br/></p>
                        <p><button className={styles.link} data-cy="back" onClick={()=>userdata.logout()}>BACK</button></p>
                    </div>
                </div>
            }
        </>
    }
    return <>
        {(showLogin <= 1) ?
                <div className={styles.login_dialog}>
                    <Link className={styles.quit} href="/" />
                    <div>
                        <h2>Log in</h2>
                        <p>Attention, you cannot login with your Duolingo account.</p><p>You have to register for the
                        unofficial stories separately, as they are an independent project.</p>
                        <input value={usernameInput} onChange={usernameInputSetValue} onKeyDown={handleKeypressLogin}
                               data-cy="username" type="text" placeholder="Username"/>
                        <input value={passwordInput} onChange={passwordInputSetValue} onKeyDown={handleKeypressLogin}
                               data-cy="password" type="password" placeholder="Password"/>
                        {state === -1 ? <><span className={styles.login_error} data-cy="login_error">{error}</span><br/></> : null}
                        <span><input type="checkbox" checked={remember}
                                     onChange={setRemember}/> keep me logged in</span>
                        <button data-cy="submit" className={styles.login_dialog_button} onClick={buttonLogin}>{state !== 1 ? "Log in" : "..."}</button>
                        <p>Don't have an account? <button className={styles.link} onClick={() => doSetShowLogin(2)}>SIGN
                            UP</button></p>
                        <p>Forgot your password? <button className={styles.link}
                                                         onClick={() => doSetShowLogin(3)}>RESET</button></p>
                    </div>
                </div>
            : (showLogin === 2) ?
                <div className={styles.login_dialog}>
                    <Link className={styles.quit} href="/"/>
                    <div>
                        <h2>Sign up</h2>
                        <p>If you register you can keep track of the stories you have already finished.</p>
                        <p>Registration is optional, stories can be accessed even without login.</p>
                        <input data-cy="username" value={usernameInput} onChange={usernameInputSetValue} onKeyDown={handleKeypressSignup} type="text"
                               placeholder="Username"/>
                        <input data-cy="email" value={emailInput} onChange={emailInputSetValue} onKeyDown={handleKeypressSignup} type="email" placeholder="Email"/>
                        <input data-cy="password" value={passwordInput} onChange={passwordInputSetValue} onKeyDown={handleKeypressSignup} type="password"
                               placeholder="Password"/>
                        {state === -1 ?
                            <span className={styles.login_error} data-cy="login_error">{error}</span> : null }
                        {state === 2 ?
                            <span>{message}</span> :
                            <button data-cy="submit"  className={styles.login_dialog_button}
                                    onClick={register_button}>{state !== 1 ? "Sign up" : "..."}</button>
                        }
                        <p>Already have an account? <button className={styles.link} onClick={()=>doSetShowLogin(1)}>LOG IN</button></p>
                        <p>Forgot your password? <button className={styles.link} onClick={()=>doSetShowLogin(3)}>RESET</button></p>
                    </div>
                </div>
                : (showLogin === 3) ?
                    <div className={styles.login_dialog}>
                        <Link className={styles.quit} href="/"/>
                        <div>
                            <h2>Reset password</h2>
                            <p>If you forgot your password, we can send you a link to choose a new one.</p>
                            <input data-cy="username" value={usernameInput} onChange={usernameInputSetValue} type="text"
                                   placeholder="Username"/>
                            {state === -1 ?
                                <span className={styles.login_error} data-cy="login_error">{error}</span> : null }
                            {state === 2 ?
                                <span>{message}</span> :
                                <button data-cy="submit"  className={styles.login_dialog_button}
                                        onClick={reset_button}>{state !== 1 ? "Reset" : "..."}</button>
                            }
                            <p>Or still remember your password? <button className={styles.link} onClick={()=>doSetShowLogin(1)}>LOG IN</button></p>
                        </div>
                    </div>
                    : null
        }
    </>
}
