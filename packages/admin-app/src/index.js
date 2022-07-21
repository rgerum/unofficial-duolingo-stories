import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import {LoginDialog, useUsername} from "./login";
import {Spinner} from "./react/spinner";
import {UserList} from "./user-editor";
import {LanguageList} from "./language-editor"
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useParams,
} from "react-router-dom";
import {CourseList} from "./course-editor";
import {Sync} from "./github-sync";


export function LoginWrapper() {
    let [username, doLogin, doLogout, showLogin, setShowLogin] = useUsername();

    console.log(username)
    // loading
    if (username === undefined) return <Spinner/>
    // no username show login
    if (username.username === undefined || username.admin !== 1)
        return <LoginDialog useUsername={[username, doLogin, doLogout, showLogin, setShowLogin]} />

    // logged in and allowed!
    return <>
        <div id="toolbar">
            <Link to="/users">users</Link>
            <Link to="/languages">languages</Link>
            <Link to="/courses">courses</Link>
            <Link to="/sync">sync</Link>
        </div>
        <div id="root">
            <Routes>
                <Route path='/users' element={<UserList />}></Route>
                <Route path='/languages' element={<LanguageList />}></Route>
                <Route path='/courses' element={<CourseList />}></Route>
                <Route path='/sync' element={<Sync />}></Route>
            </Routes>
        </div>
    </>
}

ReactDOM.render(
    <React.StrictMode>
        <Router>
            <LoginWrapper />
        </Router>
    </React.StrictMode>,
    document.getElementById('body')
);
