function useDataFetcher(fetcher, args=[]) {
    const [data, updateData] = React.useState(undefined);
    const [done, updateDone] = React.useState(false);

    React.useEffect(() => {
        async function doFetch() {
            updateData(undefined);
            //if(language_data === undefined)
                await getLanguageNames();
            const fetched_data = await fetcher(...args);
            updateData(fetched_data);
            updateDone(true);
        }
        doFetch();
    }, args);
    return data;
}

function useInput(def) {
    let [value, setValue] = React.useState(def);
    return [value, e => setValue(e.target.value)];
}

// Hook
function useEventListener(eventName, handler, element = window){
    // Create a ref that stores handler
    const savedHandler = React.useRef();

    // Update ref.current value if handler changes.
    // This allows our effect below to always get latest handler ...
    // ... without us needing to pass it in effect deps array ...
    // ... and potentially cause effect to re-run every render.
    React.useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    React.useEffect(
        () => {
            // Make sure element supports addEventListener
            // On
            const isSupported = element && element.addEventListener;
            if (!isSupported) return;

            // Create event listener that calls handler function stored in ref
            const eventListener = event => savedHandler.current(event);

            // Add event listener
            element.addEventListener(eventName, eventListener);

            // Remove event listener on cleanup
            return () => {
                element.removeEventListener(eventName, eventListener);
            };
        },
        [eventName, element] // Re-run if eventName or element changes
    );
}

function Spinner(props) {
    return (
        <div id="spinner" style={{position: "relative", width: "100%", height: "200px"}}>
            <div className="spinner_parent">
                <div className="spinner_point point1" />
                <div className="spinner_point point2" />
                <div className="spinner_point point3" />
            </div>
        </div>
    );
}


function App(props) {
    let urlParams = new URLSearchParams(window.location.search);
    const [story, setStory] = React.useState(urlParams.get("story") || null);
    const [course, setCourse] = React.useState([urlParams.get("lang") || undefined, urlParams.get("lang_base") || undefined]);

    function changeStory(id) {
        setStory(id);
        if(id) {
            history.pushState({story: id}, "Story" + id, `react_story.html?story=${id}`);
            dispatchEvent(new CustomEvent('progress_changed', {detail: id}));
        }
        else {
            doSetCourse(course);
        }
    }
    function doSetCourse(course) {
        if(course[0] === undefined)
            history.pushState({course: course}, "Language"+course, `index_react.html`);
        else
            history.pushState({course: course}, "Language"+course, `index_react.html?lang=${course[0]}&lang_base=${course[1]}`);
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
        return <IndexContent course={course} setCourse={doSetCourse} onStartStory={changeStory} />
    return <Story story={story} onQuit={()=>{changeStory(null)}} />
}

window.addEventListener("DOMContentLoaded", () => {
    ReactDOM.render(
        <App />,
        document.getElementById('root')
    );
})
