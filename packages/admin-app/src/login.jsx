import React from 'react';
import './index.css'
import './login.css';
import {useInput} from "story-component";
import {getSession, login} from "./api_calls.mjs";


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
        //await logout();
        setUsername({});
        setShowLogin(1);
    }
    if(username === null) {
        setUsername(undefined);
        getUsernameFirstTime();
        return [undefined, doLogin, doLogout];
    }
    return [username, doLogin, doLogout, showLogin, setShowLogin];
}


export function LoginDialog(props) {
    let [username, doLogin, doLogout, showLogin, setShowLogin] = props.useUsername;
    username = username.username;

    let [state, setState] = React.useState(0);
    let [error, setError] = React.useState("");

    let [usernameInput, usernameInputSetValue] = useInput("");
    let [passwordInput, passwordInputSetValue] = useInput("");

    async function buttonLogin() {
        setState(1);
        let username;
        try {
            username = await doLogin(usernameInput, passwordInput);
        }
        catch (e) {
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

        //Press Enter To Login Function
        const handleLogin = (event) =>{
            if(event.keyCode === 13){
                buttonLogin()
            }
        }
        //End Of Enter To Login Function


    return <>
        {(showLogin === 1 && username === undefined) ?
            <div id="login_dialog" onKeyDown={handleLogin} >
                <div>
                    <h2>Admin Panel Log in</h2>
                    <p>You need an admin account to login here.</p>
                    <input value={usernameInput} onChange={usernameInputSetValue} type="text" placeholder="Username" data-cy="username" id="login_dialog_username" autoFocus/>
                    <input value={passwordInput} onChange={passwordInputSetValue} type="password" placeholder="Password"  data-cy="password" id="login_dialog_password"/>
                    {state === -1 ? <span className="login_error" data-cy="login_error">{error}</span>: null}
                    <button className="button" onClick={buttonLogin}  data-cy="submit">{state !== 1 ? "Log in" : "..."}</button>
                </div>
            </div>
        :
            <div id="login_dialog">
                <div>
                    <h2>Not allowed</h2>
                    <img alt={"sad duo"} width="80p" src="https://design.duolingo.com/28e4b3aebfae83e5ff2f.svg" /><br/>
                    <p>You need to have permissions<br/>to access the admin panel.<br/></p>
                    <p><button className="link" data-cy="back" onClick={()=>doLogout()}>BACK</button></p>
                </div>
            </div>
        }
    </>
}


export function LoggedInButton(props) {
    let username = props.username;
    let doLogout = props.doLogout;

    //username = {role: 1, username: "test"}
    if(username !== undefined)
        return <div id="loggedin" title={username.username}>
            <span>{username.username.substring(0, 1)}</span>
            <div id="diamond-wrap">
                <div id="diamond"></div>
            </div>
            <div id="profile_dropdown">
                {username.role !== 0 ? <div id="button_editor" className="profile_dropdown_button"
                                            onClick={()=>{window.location.href = "https://www.duostories.org"}}
                >Stories</div> : null}
                {username.admin !== 0 ? <div id="button_editor" className="profile_dropdown_button"
                                             onClick={()=>{window.location.href = "https://editor.duostories.org"}}
                >Editor</div> : null}
                <div className="profile_dropdown_button" onClick={() => doLogout()} >Log out</div>
            </div>
        </div>
}