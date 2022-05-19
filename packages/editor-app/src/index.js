import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import {LoginDialog, useUsername} from "./login";
import {Spinner} from "./react/spinner";
import {EditorOverview} from "./course-editor"
import {AvatarMain} from "./avatar_editor";
import {EditorNode} from "./story-editor";


let urlParams = new URLSearchParams(window.location.search);

export function LoginWrapper() {
    let [username, doLogin, doLogout, showLogin, setShowLogin] = useUsername();

    // loading
    if (username === undefined) return <Spinner/>
    // no username show login
    if (username.username === undefined || username.role !== 1)
        return <LoginDialog useUsername={[username, doLogin, doLogout, showLogin, setShowLogin]} />

    // logged in and allowed!
    if(!urlParams.get("story") && !urlParams.get("language")) {
        return <EditorOverview />
    }
    else if(!urlParams.get("story")) {
        return <AvatarMain />
    }
    else {
        return <EditorNode />
        return <div>bla</div>
    }
}

ReactDOM.render(
    <React.StrictMode>
        <LoginWrapper />
    </React.StrictMode>,
    document.getElementById('body')
);
