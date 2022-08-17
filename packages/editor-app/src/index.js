import React from 'react';
import ReactDOM from 'react-dom';
import {LoginDialog, useUsername} from "./login";
import {Spinner} from "./react/spinner";
import {EditorOverview} from "./course-editor"
import {AvatarMain} from "./avatar_editor";
import {EditorNode} from "./story-editor";
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";


export function LoginWrapper() {
    let [username, doLogin, doLogout, showLogin, setShowLogin] = useUsername();

    // loading
    if (username === undefined) return <Spinner/>
    // no username show login
    if (username.username === undefined || username.role !== 1)
        return <LoginDialog useUsername={[username, doLogin, doLogout, showLogin, setShowLogin]} />

    return <Routes>
        <Route path='/course/:id' element={<EditorOverview />}></Route>
        <Route path='/' element={<EditorOverview />}></Route>
        <Route path='/story/:story' element={<EditorNode />}></Route>
        <Route path='/language/:language' element={<AvatarMain />}></Route>
    </Routes>
}

ReactDOM.render(
    <React.StrictMode>
        <Router>
            <LoginWrapper />
        </Router>
    </React.StrictMode>,
    document.getElementById('body')
);
