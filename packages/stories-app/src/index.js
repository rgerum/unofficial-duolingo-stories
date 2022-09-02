import React from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';

import {Story, Spinner, useDataFetcher} from "story-component";

import {IndexContent} from "./overview";
import {UserActivationOrReset} from "./user_activation_or_reset";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useParams,
} from "react-router-dom";
import {getStoryJSON} from "story-component/src/components/includes";
import {LoginDialog} from "./login";
import {load_dark_mode} from "story-component";
import {Faq} from "./faq";


function StoryP() {
    let { id } = useParams();
    let test = window.location.href.endsWith("test");
    let story_data = useDataFetcher(getStoryJSON, [id])
    if(story_data === undefined)
        return <Spinner/>
    if(story_data === null)
        return <Error/>
    if(test)
        return <div id="main"><Story id={id} editor={{lineno: 3}} story={story_data} /></div>
    return <Story id={id} story={story_data} />
}

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

    return <Routes>
            <Route path='/' element={<IndexContent />}></Route>
            <Route path='conlangs' element={<IndexContent filter={'conlang'} />}></Route>
            <Route path='/:lang-:lang_base' element={<IndexContent />}></Route>
            <Route path='/login' element={<LoginDialog />}></Route>
            <Route path='/story/:id' element={<StoryP />}></Route>
            <Route path='/story/:id/test' element={<StoryP />}></Route>
            <Route path='/task/:task/:username/:hash' element={<UserActivationOrReset />}></Route>
            <Route path='/faq' element={<Faq />}></Route>
            <Route path='/*' element={<IndexContent error />}></Route>
        </Routes>
}

function Error() {
    return <div id="login_dialog">
        <div>
            <h2>404 Not Found</h2>
            <img alt={"sad duo"} width="80p" src="https://design.duolingo.com/28e4b3aebfae83e5ff2f.svg" /><br/>
            <p>The page you requested was not found.<br/></p>
            <p>If you think this is an error on the website, please report it on <a href="https://discord.gg/4NGVScARR3">Discord</a>.</p>
            <p><Link className="link" data-cy="back" to="/">to main</Link></p>
        </div>
    </div>
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <Router>
        <App />
      </Router>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

window.addEventListener("DOMContentLoaded", load_dark_mode);
