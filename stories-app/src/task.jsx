import React from 'react';
import './login.css';
import {useInput} from "./hooks.js";
import {activate, reset_pw_check, reset_pw_set} from "./login.jsx";


async function do_activate(setActivated) {
    console.log(do_activate)
    const urlParams = new URLSearchParams(window.location.search);
    let success = await activate({username: urlParams.get("username"), activation_link: urlParams.get("activation_link")});
    if(success === false) {
        setActivated(-1);
    }
    else {
        setActivated(1);
    }
}


async function check(setResetPwState) {
    const urlParams = new URLSearchParams(window.location.search);
    let [success, text] = await reset_pw_check({username: urlParams.get("username"), uuid: urlParams.get("activation_link")});
    console.log(success, text)
    if(success === false) {
        setResetPwState(-1);
    }
    else {
        setResetPwState(1);
    }
}


async function login_button(setResetPwState, passwordInput) {
    let urlParams = new URLSearchParams(window.location.search);
    let success = await reset_pw_set({username: urlParams.get("username"), uuid: urlParams.get("activation_link"), password: passwordInput});
    if(success === false) {
        setResetPwState(3);
    }
    else {
        setResetPwState(2);
    }
}


export function Task(props) {
    let [initialized, setInitialized] = React.useState(0);
    let [activated, setActivated] = React.useState(0);
    let [restpwstate, setResetPwState] = React.useState(0);
    let [passwordInput, passwordInputSetValue] = useInput("");

    function reset_pw_clicked() {login_button(setResetPwState, passwordInput)}

    if(!initialized) {
        console.log(initialized);
        setInitialized(1);
        if(props.task === "activate")
            do_activate(setActivated);
        else if(props.task === "resetpw")
            check(setResetPwState);
    }
    return <>{props.task === "activate" ?
    <div id="login_dialog">
        <div>
            <h2>Activate account</h2>
            {activated === 0 ?
                <p id="status">activating account...</p>
                : activated === 1 ?
                    <>
                        <p id="status">Activation successful.</p>
                        <p id="login_form">
                            You can now go back to the <a href="../../admin/index.html">Main page</a> and log in.
                        </p>
                    </>
                    :
                    <p id="status">Activation not successful.</p>
            }
        </div>
    </div>
    : props.task === "resetpw" ?
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
                    You can now go back to the <a href="../../admin/index.html">Main page</a> and log in.
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
