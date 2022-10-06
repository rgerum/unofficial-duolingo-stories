import React from 'react';
import './login.css';
import {useInput, LoggedInButton} from "story-component";
import {useSuspendedDataFetcher} from "./api_calls/include";
import {get_login, login, logout, register, reset_pw} from "./api_calls/user";
import {Link, useNavigate} from "react-router-dom";


//////////

export function useUsername() {
    const [user, setUser] = React.useState(undefined);
    let courses_user = useSuspendedDataFetcher(get_login, []);

    if(user !== undefined)
        courses_user = user;

    async function login2(username, password, remember) {
        await login(username, password, remember);
        let user = await get_login();
        setUser(user);
        return user;
    }

    async function logout2() {
        await logout();
        let user = await get_login();
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
        let userdata_new;
        try {
            userdata_new = await userdata.login(usernameInput, passwordInput, remember);
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
