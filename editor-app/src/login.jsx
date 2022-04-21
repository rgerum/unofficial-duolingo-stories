import React from 'react';
import './login.css';
import {useInput} from "./hooks";
import {dict_to_query, fetch_post} from "./includes.mjs";
import {getSession, login} from "./api_calls.mjs";

let backend = 'https://carex.uber.space/stories/backend/';
let backend_user = backend+'user/';


export async function get_login() {
    // get the current login status
    let response = await fetch(`${backend_user}user.php?action=get_login`)
    try {
        // return the response
        let json = await response.json();
        if(json === null)
            return undefined;
        return json;
    }
    catch (e) {
        return undefined;
    }
}

export async function register(data) {
    // register a new user
    let response;
    try {
        response = await fetch_post(`${backend_user}user.php?action=register`, data)
    }
    // something wrong :-(
    catch (e) {
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
export async function reset_pw(data) {
    // register a new user
    let response;
    try {
        response = await fetch_post(`${backend_user}user.php?action=send`, data)
    }
        // something wrong :-(
    catch (e) {
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
export async function reset_pw_check(data) {
    // register a new user
    let response;
    try {
        response = await fetch_post(`${backend_user}user.php?action=check`, data)
    }
        // something wrong :-(
    catch (e) {
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

export async function reset_pw_set(data) {
    // register a new user
    let response;

    try {
        response = await fetch_post(`${backend_user}user.php?action=set`, data);
    } // something wrong :-(
    catch (e) {
        return false;
    } // not allowed? perhaps the username is already taken

    if (response.status === 403) {
        await response.text();
        return false;
    } // again something wrong?
    else if (response.status !== 200) {
        return false;
    } // everything ok!
    return true;
}


export async function activate(data) {
    console.log("activate", data);
    let reponse = await fetch(`${backend_user}user.php?action=activate&${dict_to_query(data)}`);
    return reponse.status === 200;

}


export async function logout() {
    // send the signal to logout
    await fetch(`${backend_user}user.php?action=logout`);
    get_login();
}


export function useUsername() {
    let [username, setUsername] = React.useState(null);
    let [showLogin, setShowLogin] = React.useState(1);

    async function getUsernameFirstTime() {
        let login = await getSession();
        setUsername(login);
    }

    async function doLogin(username, password) {
        let success = await login({username: username, password: password});
        if(success === false) {
            //window.alert("Error: username or password is wrong.");
            return undefined;
        }
        else {
            let login = await getSession();
            setUsername(login);
            return login;
        }
    }
    async function doLogout() {
        await logout();
        console.log("doLogout", undefined)
        setUsername(undefined);
    }
    if(username === null) {
        console.log("firsttime", username)
        setUsername(undefined);
        getUsernameFirstTime();
        return [undefined, doLogin, doLogout];
    }
    return [username, doLogin, doLogout, showLogin, setShowLogin];
}


export function Login(props) {
    let [username, , doLogout, , setShowLogin] = props.useUsername;

    return <div id="loggedin" style={{float: "right"}}>
            {username !== undefined ?
                <>
                    <span id="display_username" style={{fontSize: "1.2em", paddingRight: "14px", display: "inline-block"}}>{username.username}</span>
                    {username.role !== 0 ? <button id="button_editor" className="button"
                                                  onClick={()=>{window.location.href = 'old/editor_overview.html'+window.location.search}}
                    >Editor</button> : null}
                    <button className="button" onClick={() => doLogout()} style={{float: "none"}}>Log out</button>
                </>
                :
                <button className="button" onClick={() => setShowLogin(1)} style={{float: "none"}}>Log in</button>
            }
        </div>
}

export function LoginDialog(props) {
    let [username, doLogin, , showLogin, setShowLogin] = props.useUsername;
    username = username.username;

    let [state, setState] = React.useState(0);
    let [error, setError] = React.useState("");
    let [message, setMessage] = React.useState("");

    let [usernameInput, usernameInputSetValue] = useInput("");
    let [passwordInput, passwordInputSetValue] = useInput("");
    let [emailInput, emailInputSetValue] = useInput("");

    async function buttonLogin() {
        setState(1);
        let username;
        try {
            username = await doLogin(usernameInput, passwordInput);
        }
        catch (e) {
            console.log(e);
            setError("Something went wrong.", e);
            setState(-1);
            return;
        }
        if(username === undefined) {
            setError("Wrong username or password. Try again.");
            setState(-1);
        }
        else {
            setState(0);
            setShowLogin(0);
        }
    }

    async function register_button() {
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

    return <>
        {(showLogin === 1 && username === undefined) ?
            <div id="login_dialog">
                <div>
                    <h2>Editor Log in</h2>
                    <p>You need an account that has been activated as a contributor.</p>
                    <input value={usernameInput} onChange={usernameInputSetValue} type="text" placeholder="Username"/>
                    <input value={passwordInput} onChange={passwordInputSetValue} type="password" placeholder="Password"/>
                    {state === -1 ? <span className="login_error">{error}</span>: null}
                    <button className="button" onClick={buttonLogin}>{state !== 1 ? "Log in" : "..."}</button>
                </div>
            </div>
        :
            <div id="login_dialog">
                <div>
                    <h2>Not allowed</h2>
                    <img width="80p" src="https://design.duolingo.com/28e4b3aebfae83e5ff2f.svg" /><br/>
                    <p>You need to have permissions<br/>to access the editor.<br/></p>
                    <p>If wou want to contribute,<br/>you can talk to us on <a href="https://discord.gg/4NGVScARR3">Discord</a>.</p>
                </div>
            </div>
        }
    </>
}