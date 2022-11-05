import "./index.css"
import React, { Suspense } from 'react';
import {createRoot} from 'react-dom/client';
import {LoginDialog, useUsername} from 'login';
import {Spinner} from "ui_elements";
import {EditorOverview} from "./course-editor"
import {AvatarMain} from "./avatar_editor";
import {EditorNode} from "./story-editor";
import {
    BrowserRouter as Router,
    Routes,
    Route, useNavigate,
} from "react-router-dom";
import {Stats} from "./stats";


export function LoginWrapper() {
    let urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get("story"))
        window.location = `/story/${urlParams.get("story")}`;
    if(urlParams.get("course"))
        window.location = `/course/${urlParams.get("course")}`;
    if(urlParams.get("language"))
        window.location = `/language/${urlParams.get("language")}`;

    let navigate = useNavigate();
    let userdata = useUsername();

    // loading
    if (userdata === undefined) return <Spinner/>
    // no username show login
    if (userdata.username === undefined || userdata.role !== 1) {
        return <LoginDialog userdata={userdata} page={"editor"} navigate={navigate}/>
    }

    return <Suspense fallback={<></>}>
        <Routes>
            <Route path='/course/:id' element={<EditorOverview userdata={userdata} />}></Route>
            <Route path='/course/:id/import/:import_id' element={<EditorOverview userdata={userdata} />}></Route>
            <Route path='/' element={<EditorOverview userdata={userdata} />}></Route>
            <Route path='/story/:story' element={<EditorNode userdata={userdata} />}></Route>
            <Route path='/language/:language' element={<AvatarMain userdata={userdata} />}></Route>
            <Route path='/stats' element={<Stats userdata={userdata} />}></Route>
        </Routes>
    </Suspense>
}

createRoot(document.getElementById('body')).render(
    <React.StrictMode>
        <Router>
            <LoginWrapper />
        </Router>
    </React.StrictMode>
);
