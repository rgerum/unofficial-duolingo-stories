import "./index.css"
import React from 'react';
import {createRoot} from 'react-dom/client';
import {LoginDialog, useUsername} from "login";
import {Spinner} from "ui_elements";
import {UserList} from "./user-editor";
import {LanguageList} from "./language-editor"
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link, useNavigate,
} from "react-router-dom";
import {CourseList} from "./course-editor";
import {Sync} from "./github-sync";
import {LoggedInButton} from "login";


export function LoginWrapper() {
    let userdata = useUsername();

    let navigate = useNavigate();

    // loading
    if (userdata === undefined) return <Spinner/>
    // no username show login
    if (userdata.username === undefined || userdata.admin !== 1)
        return <LoginDialog userdata={userdata} page={"admin"} navigate={navigate}  />

    // logged in and allowed!
    return <>
        <div id="toolbar">
            <Link to="/users">users</Link>
            <Link to="/languages">languages</Link>
            <Link to="/courses">courses</Link>
            <Link to="/sync">sync</Link>
            <LoggedInButton userdata={userdata} page="admin"/>
        </div>
        <div id="root">
            <Routes>
                <Route path='/users' element={<UserList />}></Route>
                <Route path='/languages' element={<LanguageList />}></Route>
                <Route path='/courses' element={<CourseList />}></Route>
                <Route path='/sync' element={<Sync />}></Route>
                <Route path='/' element={<></>}></Route>
            </Routes>
        </div>
    </>
}

createRoot(document.getElementById('body')).render(
    <React.StrictMode>
        <Router>
            <LoginWrapper />
        </Router>
    </React.StrictMode>
);
