import React from 'react';
import './login.css';
import {useInput, fetch_post, LoggedInButton} from "story-component";
import {get_backend, useSuspendedDataFetcher} from "./api_calls";
import {Link, useNavigate} from "react-router-dom";

let backend = get_backend();
let backend_user = backend+'user/';

const backend_express = "https://duostories.org/stories/backend_node/"

//////////
export async function get_login2() {
    // get the current login status
    const response = await fetch(`${backend_express}session`, {credentials: 'include'});  // {credentials: "same-origin"}
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

export function useUsername2() {
    const [user, setUser] = React.useState(undefined);
    let courses_user = useSuspendedDataFetcher(get_login2, []);

    if(user !== undefined)
        courses_user = user;

    async function login2(username, password, remember) {
        console.log("login2")
        await login(username, password, remember);
        console.log("done")
        let user = await get_login2();
        console.log("get login", user);
        setUser(user);
        return user;
    }

    async function logout2() {
        await logout();
        let user = await get_login2();
        setUser(user);
        return user;
    }

    return {
        username: courses_user?.username,
        admin: courses_user?.admin,
        role: courses_user?.role,
        response: courses_user,
        login: login2,
        logout: logout2,
    };
}



////////////


export async function login(username, password, remember) {
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "password=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    async function fetch_post(url, data)
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

    let response = await fetch_post(`${backend_express}login`, {username: username, password: password, remember: remember});
    return response.status !== 403;
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
    let reponse = await fetch_post(`${backend_user}user.php?action=activate`, data);
    return reponse.status === 200;
}


export async function logout() {
    // send the signal to logout
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "password=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    await fetch(`${backend_express}logout`, {credentials: 'include'});
}

export function Login({userdata}) {
    if(userdata.username !== undefined)
        return <LoggedInButton userdata={userdata} page="stories"/>

    return <Link id="log_in" to={"/login"}>
        <button className="button" style={{float: "none"}}>Log in</button>
    </Link>
}

export default function LoginDialog({userdata}) {
    let [showLogin, setShowLogin] = React.useState(0);

    let [state, setState] = React.useState(0);
    let [error, setError] = React.useState("");
    let [message, setMessage] = React.useState("");

    let [usernameInput, usernameInputSetValue] = useInput("");
    let [passwordInput, passwordInputSetValue] = useInput("");
    let [emailInput, emailInputSetValue] = useInput("");

    let [remember, setRememberX] = React.useState(false);

    function doSetShowLogin(value) {
        setShowLogin(value);
        setState(0);
        setError("");
        setMessage("");
    }

    function setRemember(e) {
        setRememberX(e.target.checked);
    }

    let navigate = useNavigate();

    async function buttonLogin() {
        setState(1);
        let username;
        try {
            username = await userdata.login(usernameInput, passwordInput, remember);
        }
        catch (e) {
            console.log(e);
            setError("Something went wrong.");
            setState(-1);
            return;
        }
        if(username === undefined) {
            setError("Wrong username or password. Try again.");
            setState(-1);
        }
        else {
            setState(0);
            //setShowLogin(0);
            navigate("/");
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
    if(userdata === undefined)
        throw "nooo"

    return <>
        {(showLogin <= 1) ?
            <div id="login_dialog">
                <Link id="quit" to={"/"} />
                <div>
                    <h2>Log in</h2>
                    <p>Attention, you cannot login with your Duolingo account.</p><p>You have to register for the unofficial stories separately, as they are an independent project.</p>
                    <input value={usernameInput} onChange={usernameInputSetValue} onKeyDown={handleKeypressLogin} type="text" placeholder="Username"/>
                    <input value={passwordInput} onChange={passwordInputSetValue} onKeyDown={handleKeypressLogin} type="password" placeholder="Password"/>
                    {state === -1 ? <><span className="login_error">{error}</span><br/></>: null}
                    <span><input type="checkbox" checked={remember} onChange={setRemember}/> keep me logged in</span>
                    <button className="button" onClick={buttonLogin}>{state !== 1 ? "Log in" : "..."}</button>
                    <p>Don't have an account? <button className={"link"} onClick={()=>doSetShowLogin(2)}>SIGN UP</button></p>
                    <p>Forgot your password? <button className={"link"} onClick={()=>doSetShowLogin(3)}>RESET</button></p>
                </div>
            </div>
        : (showLogin === 2) ?
            <div id="login_dialog">
                <Link id="quit" to={"/"} />
                <div>
                    <h2>Sign up</h2>
                    <p>If you register you can keep track of the stories you have already finished.</p>
                    <p>Registration is optional, stories can be accessed even without login.</p>
                    <input value={usernameInput} onChange={usernameInputSetValue} onKeyDown={handleKeypressSignup} type="text"
                           placeholder="Username"/>
                    <input value={emailInput} onChange={emailInputSetValue} onKeyDown={handleKeypressSignup} type="email" placeholder="Email"/>
                    <input value={passwordInput} onChange={passwordInputSetValue} onKeyDown={handleKeypressSignup} type="password"
                           placeholder="Password"/>
                    {state === -1 ?
                        <span className="login_error">{error}</span> : null }
                    {state === 2 ?
                        <span>{message}</span> :
                        <button className="button"
                                onClick={register_button}>{state !== 1 ? "Sign up" : "..."}</button>
                    }
                    <p>Already have an account? <button className={"link"} onClick={()=>doSetShowLogin(1)}>LOG IN</button></p>
                    <p>Forgot your password? <button className={"link"} onClick={()=>doSetShowLogin(3)}>RESET</button></p>
                </div>
            </div>
        : (showLogin === 3) ?
            <div id="login_dialog">
                <Link id="quit" to={"/"} />
                <div>
                    <h2>Reset password</h2>
                    <p>If you forgot your password, we can send you a link to choose a new one.</p>
                    <input value={usernameInput} onChange={usernameInputSetValue} type="text"
                           placeholder="Username"/>
                    {state === -1 ?
                        <span className="login_error">{error}</span> : null }
                    {state === 2 ?
                        <span>{message}</span> :
                        <button className="button"
                                onClick={reset_button}>{state !== 1 ? "Reset" : "..."}</button>
                    }
                    <p>Or still remember your password? <button className={"link"} onClick={()=>doSetShowLogin(1)}>LOG IN</button></p>
                </div>
            </div>
            : null
        }
    </>
}
