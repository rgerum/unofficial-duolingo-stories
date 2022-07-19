import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import {LoginDialog, useUsername} from "./login";
import {Spinner} from "./react/spinner";
import {UserOverview} from "./user-editor";

let urlParams = new URLSearchParams(window.location.search);

export function LoginWrapper() {
    let [username, doLogin, doLogout, showLogin, setShowLogin] = useUsername();

    console.log(username)
    // loading
    if (username === undefined) return <Spinner/>
    // no username show login
    if (username.username === undefined || username.admin !== 1)
        return <LoginDialog useUsername={[username, doLogin, doLogout, showLogin, setShowLogin]} />

    // logged in and allowed!
    return <UserOverview/>
}

ReactDOM.render(
    <React.StrictMode>
        <LoginWrapper />
    </React.StrictMode>,
    document.getElementById('body')
);
