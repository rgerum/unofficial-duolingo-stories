import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';

import {Story} from "story-component";

import {useDataFetcher2, useEventListener} from "./hooks";
import {getLanguageNames} from "./api_calls";
import {IndexContent} from "./overview";
import {UserActivationOrReset} from "./user_activation_or_reset";


function App() {
    let urlParams = new URLSearchParams(window.location.search);
    // activate
    const [task, setTask] = React.useState(urlParams.get("task") || null);
    // error
    const [error, ] = React.useState(urlParams.get("error") || null);
    // story
    const [story, setStory] = React.useState(urlParams.get("story") || null);
    const [test_mode, ] = React.useState(urlParams.get("test") || null);
    const [course, setCourse] = React.useState([urlParams.get("lang") || undefined, urlParams.get("lang_base") || undefined]);
    // language_dataRefetch
    let [language_data, ] = useDataFetcher2(getLanguageNames, []);

    function changeStory(id, task) {
        setStory(id);
        if(id) {
            if(test_mode)
                window.history.pushState({story: id}, "Story" + id, `?story=${id}&test=1`);
            else
                window.history.pushState({story: id}, "Story" + id, `?story=${id}`);
            dispatchEvent(new CustomEvent('progress_changed', {detail: id}));
        }
        else if(error) {
            window.history.pushState({error: error}, "Error", `?error=${error}`);
        }
        else if(task) {
            doSetTask(task);
        }
        else {
            doSetCourse(course);
        }
    }
    function doSetCourse(course) {
        if(course[0] === undefined)
            window.history.pushState({course: course}, "Language"+course, ``);
        else
            window.history.pushState({course: course}, "Language"+course, `?lang=${course[0]}&lang_base=${course[1]}`);
        setCourse(course);
    }
    function doSetTask(task) {
        //urlParams.get("username") // username=test7&activation_link=dd2182ff-e8ec-4bc7-822b-4eeb7e624c27
        window.history.pushState({task: task}, "Language", `?task=${task}&username=${urlParams.get("username")}&activation_link=${urlParams.get("activation_link")}`);
        setTask(task);
    }

    useEventListener("popstate", (event) => {
        if(event.state.story)
            changeStory(event.state.story)
        else {
            setStory(null);
            if(event.state.course)
                doSetCourse(event.state.course)
            else
                doSetCourse([undefined, undefined])
        }
    })

    let [initialized, setInitialized] = React.useState(0);
    if(!initialized) {
        let urlParams = new URLSearchParams(window.location.search);
        setInitialized(1);
        changeStory(urlParams.get('story'), urlParams.get('task'));
    }

    if(test_mode) {
        return <div id="main">
            <Story editor={{lineno: 3}} story_id={story} />
        </div>
    }
    if(error) {
        return <div id="main">404</div>
    }

    if(task !== null) {
        return <UserActivationOrReset task={task} />
    }
    else if(story === null)
        return <IndexContent language_data={language_data} course={course} setCourse={doSetCourse} onStartStory={changeStory} />
    return <Story language_data={language_data} story_id={story} onQuit={()=>{changeStory(null)}} />
}


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
