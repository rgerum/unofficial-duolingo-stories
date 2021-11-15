import React from 'react';
import {useInput} from "../stories-app/src/hooks";

let backend = 'https://carex.uber.space/stories/backend/';
let backend_user = backend+'user/';

function inputs_to_dict(inputs) {
    let result = {}
    for(let name in inputs) {
        result[name] = document.querySelector(inputs[name]).value;
    }
    return result;
}
function dict_to_query(data) {
    let query = [];
    for(let name in data)
        query.push(`${encodeURIComponent(name)}=${encodeURIComponent(data[name])}`);
    return query.join("&")
}
function fetch_post(url, data) {
    var fd = new FormData();
    //very simply, doesn't handle complete objects
    for(var i in data){
        fd.append(i,data[i]);
    }
    var req = new Request(url,{
        method:"POST",
        body:fd,
        mode:"cors"
    });
    return fetch(req);
}

export async function get_login() {
    let response = await fetch(`${backend_user}get_login.php`)
    if(response.status === 403)
        return undefined;

    let text = response.json();
    return text;
}

export async function login(data) {
    let reponse = await fetch(`${backend_user}check_auth.php?${dict_to_query(data)}`)
    if(reponse.status === 403)
        return false;
    return true;
}

export async function register(data) {
    let response;
    try {
        response = await fetch_post(`${backend_user}register_send.php`, data)
    }
    catch (e) {
        return [false, "Something went wrong."];
    }
    if(response.status === 403) {
        let text = await response.text();
        return [false, text];
    }
    else if(response.status !== 200) {
        return [false, "Something went wrong."];
    }
    return [true, ""];
}


export async function activate(data) {
    let reponse = await fetch(`${backend_user}get_activation.php?${dict_to_query(data)}`)
    if(reponse.status !== 200) {
        return false;
    }
    return true;
}
window.activate = activate;

export async function logout() {
    let reponse = await fetch(`${backend_user}set_logout.php`)
    get_login();
}


export function LoginButton() {
    let [username, doLogin, doLogout] = useUsername();
    return <Login useUsername={[username, doLogin, doLogout]} />
}

export function useUsername() {
    let [username, setUsername] = React.useState(null);

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
    return [username, doLogin, doLogout];
}


export function Login(props) {
    let [username, doLogin, doLogout] = props.useUsername;
    let [showLogin, setShowLogin] = React.useState(0);
    let [state, setState] = React.useState(0);
    let [error, setError] = React.useState("");
    let [message, setMessage] = React.useState("");

    let [usernameInput, usernameInputSetValue] = useInput();
    let [passwordInput, passwordInputSetValue] = useInput();
    let [emailInput, emailInputSetValue] = useInput();

    async function buttonLogin() {
        setState(1);
        let username;
        try {
            username = await doLogin(usernameInput, passwordInput);
        }
        catch (e) {
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

    return <>
        <div id="loggedin" style={{float: "right"}}>
            {username !== undefined ?
                <>
                    <span id="display_username" style={{fontSize: "1.2em", paddingRight: "14px", display: "inline-block"}}>{username.username}</span>
                    {username.role != 0 ? <button id="button_editor" className="button"
                                                  onClick={()=>{window.location.href = 'editor_overview.html'+window.location.search}}
                    >Editor</button> : null}
                    <button className="button" onClick={() => doLogout()} style={{float: "none"}}>Log out</button>
                </>
                :
                <button className="button" onClick={() => setShowLogin(1)} style={{float: "none"}}>Log in</button>
            }
        </div>
        {(showLogin === 1 && username === undefined) ?
            <div id="login_dialog">
                <span id="quit" onClick={()=>setShowLogin(0)} />
                <div>
                    <h2>Log in</h2>
                    <p>Attention, you cannot login with your Duolingo account.</p><p>You have to register for the unofficial stories separately, as they are an independent project.</p>
                    <input value={usernameInput} onChange={usernameInputSetValue} type="text" placeholder="Username"/>
                    <input value={passwordInput} onChange={passwordInputSetValue} type="password" placeholder="Password"/>
                    {state === -1 ? <span className="login_error">{error}</span>: null}
                    <button className="button" onClick={buttonLogin}>{state !== 1 ? "Log in" : "..."}</button>
                    <p>Don't have an account? <a onClick={()=>setShowLogin(2)}>SIGN UP</a></p>
                </div>
            </div>
            : (showLogin === 2 && username === undefined) ?
                <div id="login_dialog">
                    <span id="quit" onClick={() => setShowLogin(0)}/>
                    <div>
                        <h2>Sign up</h2>
                        <p>If you register you can keep track of the stories you have already finished.</p>
                        <p>Registration is optional, stories can be accessed even without login.</p>
                        <input value={usernameInput} onChange={usernameInputSetValue} type="text"
                               placeholder="Username"/>
                        <input value={emailInput} onChange={emailInputSetValue} type="email" placeholder="Email"/>
                        <input value={passwordInput} onChange={passwordInputSetValue} type="password"
                               placeholder="Password"/>
                        {state === -1 ?
                            <span className="login_error">{error}</span> : null }
                        {state === 2 ?
                            <span>{message}</span> :
                            <button className="button"
                                    onClick={register_button}>{state !== 1 ? "Sign up" : "..."}</button>
                        }
                        <p>Already have an account? <a onClick={()=>setShowLogin(1)}>LOG IN</a></p>
                    </div>
                </div>
                : null
        }
    </>
}