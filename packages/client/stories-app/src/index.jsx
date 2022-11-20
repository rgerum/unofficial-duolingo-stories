import './index.css';

import React, {Suspense, lazy, useState} from 'react';
import {createRoot} from 'react-dom/client';

import {
    BrowserRouter as Router,
    Routes,
    Route, useNavigate,
} from "react-router-dom";
import {load_dark_mode} from "includes";
import {LoginDialog, useUsername} from "login";
import {UserActivationOrReset} from "login";
import {setStoryDone} from "./api_calls/course";
import {Helmet, HelmetProvider} from "react-helmet-async";
const IndexContent = lazy(() => import('./overview'));
const StoryP = lazy(() => import('./story_wrapper'));


function App() {
    let urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get("story")) {
        if(urlParams.get("test"))
            window.location = `/story/${urlParams.get("story")}/test`;
        else
            window.location = `/story/${urlParams.get("story")}`;
    }
    if(urlParams.get("lang") && urlParams.get("lang_base"))
        window.location = `/${urlParams.get("lang")}-${urlParams.get("lang_base")}`;
    if(urlParams.get("task"))
        window.location = `/task/${urlParams.get("task")}/${urlParams.get("username")}/${urlParams.get("activation_link")}`;

    let userdata = useUsername();
    let navigate = useNavigate();

    let [storyFinishedIndex, setStoryFinishedIndex] = useState(0);
    let storyFinishedIndexUpdate = async (id) => {await setStoryDone(id); setStoryFinishedIndex(storyFinishedIndex+1);}

    return <Suspense fallback={<></>}>
        <Helmet>
            <meta property="og:title" content="Duostories" />
            <meta property="og:type" content="website" />
            <meta property="og:image" content="social.png" />
            <meta property="og:description" content={`Duostories brings the official Duolingo Stories to new languages, translated by a community effort.`} />
            <meta property="og:url" content="https://www.duostories.org" />
            <meta property="og:locale" content="en_US" />
        </Helmet>

        <Routes>
            <Route path='/login' element={<LoginDialog userdata={userdata} navigate={navigate}/>}></Route>
            <Route path='/story/:id' element={<StoryP storyFinishedIndexUpdate={storyFinishedIndexUpdate} />}></Route>
            <Route path='/story/:id/test' element={<StoryP />}></Route>
            <Route path='/task/:task/:username/:hash' element={<UserActivationOrReset />}></Route>
            <Route path='/:lang-:lang_base/*' element={<IndexContent userdata={userdata} storyFinishedIndex={storyFinishedIndex}/>}></Route>
            <Route path='/*' element={<IndexContent userdata={userdata} storyFinishedIndex={storyFinishedIndex}/>}></Route>
        </Routes>
    </Suspense>
}


createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <Router>
          <HelmetProvider>
            <App />
          </HelmetProvider>
      </Router>
  </React.StrictMode>
);

window.addEventListener("DOMContentLoaded", load_dark_mode);
