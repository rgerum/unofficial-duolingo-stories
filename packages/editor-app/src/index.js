import React from 'react';
import ReactDOM from 'react-dom';
import {LoginDialog, useUsername} from "./login";
import {Spinner} from "story-component";
import {EditorOverview} from "./course-editor"
import {AvatarMain} from "./avatar_editor";
import {EditorNode} from "./story-editor";
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";


export function LoginWrapper() {
    let urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get("story"))
        window.location = `/story/${urlParams.get("story")}`;
    if(urlParams.get("course"))
        window.location = `/course/${urlParams.get("course")}`;
    if(urlParams.get("language"))
        window.location = `/language/${urlParams.get("language")}`;


    let [username, doLogin, doLogout, showLogin, setShowLogin] = useUsername();

    // loading
    if (username === undefined) return <Spinner/>
    // no username show login
    if (username.username === undefined || username.role !== 1)
        return <LoginDialog useUsername={[username, doLogin, doLogout, showLogin, setShowLogin]} />
        
    return <Routes>
        <Route path='/course/:id' element={<EditorOverview username={username} doLogout={doLogout}/>}></Route>
        <Route path='/' element={<EditorOverview username={username} doLogout={doLogout}/>}></Route>
        <Route path='/story/:story' element={<EditorNode username={username} doLogout={doLogout}/>}></Route>
        <Route path='/language/:language' element={<AvatarMain username={username} doLogout={doLogout}/>}></Route>
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
