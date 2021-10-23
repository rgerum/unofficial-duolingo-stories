import {useInput} from "../js/hooks.js";
import {dict_to_query, fetch_post} from "../js/includes.js";

let backend = 'https://carex.uber.space/stories/backend/';
let backend_user = backend+'user/';


export async function get_login() {
    // get the current login status
    let response = await fetch(`${backend_user}get_login.php`)
    if(response.status === 403)
        return undefined;
    // return the response
    let text = response.json();
    return text;
}

export async function login(data) {
    // check if the user is logged in
    let reponse = await fetch(`${backend_user}check_auth.php?${dict_to_query(data)}`)
    if(reponse.status === 403)
        return false;
    return true;
}

export async function register(data) {
    // register a new user
    let response;
    try {
        response = await fetch_post(`${backend_user}register_send.php`, data)
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
        response = await fetch_post(`${backend_user}pw_reset_send.php?action=send`, data)
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
        response = await fetch_post(`${backend_user}pw_reset_send.php?action=check`, data)
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


export async function activate(data) {
    let reponse = await fetch(`${backend_user}get_activation.php?${dict_to_query(data)}`);
    if(reponse.status !== 200) {
        return false;
    }
    return true;
}
window.activate = activate;

export async function logout() {
    // send the signal to logout
    await fetch(`${backend_user}set_logout.php`);
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
            setMessage("Have received an email with a reet link. You may need to look into your spam folder.");
        }
    }

    return <>
        <div id="loggedin" style={{float: "right"}}>
            {username !== undefined ?
                <>
                    <span id="display_username" style={{fontSize: "1.2em", paddingRight: "14px", display: "inline-block"}}>{username.username}</span>
                    {username.role != 0 ? <button id="button_editor" className="button"
                                                  onClick={()=>{location.href = 'editor_overview.html'+window.location.search}}
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
                    <p>Forgot your password? <a onClick={()=>setShowLogin(3)}>RESET</a></p>
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
                        <p>Forgot your password? <a onClick={()=>setShowLogin(3)}>RESET</a></p>
                    </div>
                </div>
            : (showLogin === 3 && username === undefined) ?
                <div id="login_dialog">
                    <span id="quit" onClick={() => setShowLogin(0)}/>
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
                        <p>Or still remember your password? <a onClick={()=>setShowLogin(1)}>LOG IN</a></p>
                    </div>
                </div>
                : null
        }
    </>
}