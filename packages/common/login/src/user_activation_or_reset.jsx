import React from 'react';
import './login.css';
import {useInput} from "includes";
import {activate, reset_pw_check, reset_pw_set} from "./api_calls/user";
import {Link, useParams} from "react-router-dom";
import {Helmet} from "react-helmet-async";


async function do_activate(setActivated, username, hash) {
    let success = await activate({username: username, activation_link: hash});
    if(success === false) {
        setActivated(-1);
    }
    else {
        setActivated(1);
    }
}


async function check(setResetPwState, username, hash) {
    let [success, ] = await reset_pw_check({username: username, uuid: hash});
    if(success === false) {
        setResetPwState(-1);
    }
    else {
        setResetPwState(1);
    }
}


async function login_button(setResetPwState, passwordInput, username, hash) {
    let success = await reset_pw_set({username: username, uuid: hash, password: passwordInput});
    if(success === false) {
        setResetPwState(3);
    }
    else {
        setResetPwState(2);
    }
}


export function UserActivationOrReset() {
    let [initialized, setInitialized] = React.useState(0);
    let [activated, setActivated] = React.useState(0);
    let [restpwstate, setResetPwState] = React.useState(0);
    let [passwordInput, passwordInputSetValue] = useInput("");

    let {task, username, hash} = useParams();

    function reset_pw_clicked() {login_button(setResetPwState, passwordInput, username, hash)}

    if(task === "activate")
        document.title = `Duostories Activate Account`;
    else if(task === "activresetpwate")
        document.title = `Duostories Reset Password`;
    else
        document.title = `Duostories`;

    if(!initialized) {
        setInitialized(1);
        if(task === "activate")
            do_activate(setActivated, username, hash);
        else if(task === "resetpw")
            check(setResetPwState, username, hash);
    }

    return <>
        <Helmet>
            <link rel="canonical" href={`https://www.duostories.org/${task}/${username}/${hash}`} />
        </Helmet>
        {task === "activate" ?
    <div id="login_dialog">
        <div>
            <h2>Activate account</h2>
            {activated === 0 ?
                <p id="status">activating account...</p>
                : activated === 1 ?
                    <>
                        <p id="status">Activation successful.</p>
                        <p id="login_form">
                          {/* Use of absolute link because relative links would only be relative to carex.uber.space */}
                          You can now <Link to='/login'>log in</Link>.
                        </p>
                    </>
                    :
                    <p id="status">Activation not successful.</p>
            }
        </div>
    </div>
    : task === "resetpw" ?
    <div id="login_dialog">
        {restpwstate === 0 ?
            <div id="loading">
                <h2>Loading...</h2>
            </div>
        : restpwstate > 0 ?
            <div id="checked">
                <h2>Reset Password</h2>
                <p id="set_input">
                    <input value={passwordInput} onChange={passwordInputSetValue} type="password" placeholder="Password"/>

                    <button className="button" onClick={reset_pw_clicked}>Change</button>
                </p>
                { restpwstate === 3 ?
                <p id="login_status">
                    Error: something went wrong.
                </p>
                 : restpwstate === 2 ?
                <p id="login_status">
                  {/* Use of absolute link because relative links would only be relative to carex.uber.space */}
                    You can now <Link to='/login'>log in</Link>.
                </p> : null}
            </div>
        : restpwstate === -1 ?
            <div id="invalid">
                <h2>Invalid or expired link</h2>
            </div> : null
        }
    </div>
        : <></>
    }</>
}
