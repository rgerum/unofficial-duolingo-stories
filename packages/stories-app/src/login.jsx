import React from 'react';
import './login.css';
import {useInput} from "./hooks.js";
import {fetch_post} from "./includes.js";
import {get_backend} from "./api_calls";
import {Link, useNavigate} from "react-router-dom";

let backend = get_backend();
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

export async function login(data) {
    // check if the user is logged in
    let reponse = await fetch_post(`${backend_user}user.php?action=login`, data)
    return reponse.status !== 403;

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
    await fetch(`${backend_user}user.php?action=logout`);
    get_login();
}


export function LoginButton() {
    let [username, doLogin, doLogout] = useUsername();
    return <Login useUsername={[username, doLogin, doLogout]} />
}

export function useUsername() {
    let [username, setUsername] = React.useState(null);
    let [showLogin, setShowLogin] = React.useState(0);

    async function getUsernameFirstTime() {
        let login = await get_login();
        setUsername(login);
    }

    async function doLogin(username, password) {
        let success = await login({username: username, password: password});
        if(success === false) {
            //window.alert("Error: username or password is wrong.");
            return undefined;
        }
        else {
            let login = await get_login();
            setUsername(login);
            return login;
        }
    }
    async function doLogout() {
        await logout();
        setUsername(undefined);
    }
    if(username === null) {
        setUsername(undefined);
        getUsernameFirstTime();
        return [undefined, doLogin, doLogout];
    }
    return [username, doLogin, doLogout, showLogin, setShowLogin];
}


export function Login(props) {
    let [username, , doLogout, , setShowLogin] = props.useUsername;

    //username = {role: 1, username: "test"}
    if(username !== undefined)
        return <div id="loggedin" title={username.username}>
            <span>{username.username.substring(0, 1)}</span>
            <div id="diamond-wrap">
                <div id="diamond"></div>
            </div>
            <div id="profile_dropdown">
                {username.role !== 0 ? <div id="button_editor" className="profile_dropdown_button"
                                               onClick={()=>{window.location.href = "https://editor.duostories.org"}}
                >Editor</div> : null}
                {username.admin !== 0 ? <div id="button_editor" className="profile_dropdown_button"
                                            onClick={()=>{window.location.href = "https://admin.duostories.org"}}
                >Admin</div> : null}
                <div className="profile_dropdown_button" onClick={() => doLogout()} >Log out</div>
            </div>
        </div>

    return <Link id="log_in" to={"/login"}>
        <button className="button" onClick={() => setShowLogin(1)} style={{float: "none"}}>Log in</button>
    </Link>
}

export function LoginDialog() {
//    let [username, doLogin, , showLogin, setShowLogin] = props.useUsername;
    let [username, doLogin, , showLogin, setShowLogin] = useUsername();

    let [state, setState] = React.useState(0);
    let [error, setError] = React.useState("");
    let [message, setMessage] = React.useState("");

    let [usernameInput, usernameInputSetValue] = useInput("");
    let [passwordInput, passwordInputSetValue] = useInput("");
    let [emailInput, emailInputSetValue] = useInput("");

    let navigate = useNavigate();

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

    return <>
        {(showLogin <= 1 && username === undefined) ?
            <div id="login_dialog">
                <Link id="quit" to={"/"} />
                <div>
                    <h2>Log in</h2>
                    <p>Attention, you cannot login with your Duolingo account.</p><p>You have to register for the unofficial stories separately, as they are an independent project.</p>
                    <input value={usernameInput} onChange={usernameInputSetValue} onKeyDown={handleKeypressLogin} type="text" placeholder="Username"/>
                    <input value={passwordInput} onChange={passwordInputSetValue} onKeyDown={handleKeypressLogin} type="password" placeholder="Password"/>
                    {state === -1 ? <span className="login_error">{error}</span>: null}
                    <button className="button" onClick={buttonLogin}>{state !== 1 ? "Log in" : "..."}</button>
                    <p>Don't have an account? <button className={"link"} onClick={()=>setShowLogin(2)}>SIGN UP</button></p>
                    <p>Forgot your password? <button className={"link"} onClick={()=>setShowLogin(3)}>RESET</button></p>
                </div>
            </div>
        : (showLogin === 2 && username === undefined) ?
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
                    <p>Already have an account? <button className={"link"} onClick={()=>setShowLogin(1)}>LOG IN</button></p>
                    <p>Forgot your password? <button className={"link"} onClick={()=>setShowLogin(3)}>RESET</button></p>
                </div>
            </div>
        : (showLogin === 3 && username === undefined) ?
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
                    <p>Or still remember your password? <button className={"link"} onClick={()=>setShowLogin(1)}>LOG IN</button></p>
                </div>
            </div>
            : null
        }
    </>
}
