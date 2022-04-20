import React from 'react';
import './App.css';
import {useDataFetcher2, useEventListener} from "./hooks";
import {getLanguageNames} from "./api_calls";
import {IndexContent} from "./index_react";
import {StoryOld} from "./story_react_old";
import {Task} from "./task";


function App() {
  let urlParams = new URLSearchParams(window.location.search);
  // activate
  const [task, setTask] = React.useState(urlParams.get("task") || null);
  // story
  const [story, setStory] = React.useState(urlParams.get("story") || null);
  const [course, setCourse] = React.useState([urlParams.get("lang") || undefined, urlParams.get("lang_base") || undefined]);
  // language_dataRefetch
  let [language_data, ] = useDataFetcher2(getLanguageNames, []);

  function changeStory(id, task) {
    setStory(id);
    if(id) {
      window.history.pushState({story: id}, "Story" + id, `?story=${id}`);
      dispatchEvent(new CustomEvent('progress_changed', {detail: id}));
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
  if(task !== null) {
    return <Task task={task} />
  }
  else if(story === null)
    return <IndexContent language_data={language_data} course={course} setCourse={doSetCourse} onStartStory={changeStory} />
  return <StoryOld language_data={language_data} story_id={story} onQuit={()=>{changeStory(null)}} />
}

export default App;
