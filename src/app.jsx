import {useEventListener, useDataFetcher2} from '../stories-app/src/hooks.js'
import {IndexContent} from './index_react.js'
import {Story} from './story_react.js'
import {getLanguageNames} from "../stories-app/src/api_calls.js";


function App(props) {
    let urlParams = new URLSearchParams(window.location.search);
    const [story, setStory] = React.useState(urlParams.get("story") || null);
    const [course, setCourse] = React.useState([urlParams.get("lang") || undefined, urlParams.get("lang_base") || undefined]);
    let [language_data, language_dataRefetch] = useDataFetcher2(getLanguageNames, []);

    function changeStory(id) {
        setStory(id);
        if(id) {
            history.pushState({story: id}, "Story" + id, `story.html?story=${id}`);
            dispatchEvent(new CustomEvent('progress_changed', {detail: id}));
        }
        else {
            doSetCourse(course);
        }
    }
    function doSetCourse(course) {
        if(course[0] === undefined)
            history.pushState({course: course}, "Language"+course, `index.html`);
        else
            history.pushState({course: course}, "Language"+course, `index.html?lang=${course[0]}&lang_base=${course[1]}`);
        setCourse(course);
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
        changeStory(urlParams.get('story'));
    }
    if(story === null)
        return <IndexContent language_data={language_data} course={course} setCourse={doSetCourse} onStartStory={changeStory} />
    return <Story language_data={language_data} story={story} onQuit={()=>{changeStory(null)}} />
}

window.addEventListener("DOMContentLoaded", () => {
    ReactDOM.render(
        <App />,
        document.getElementById('root')
    );
})
