import {useDataFetcher, useDataFetcher2, useEventListener} from '../js/hooks.js'
import {IndexContent, Flag, Spinner} from './index_react.js'
import {Login, useUsername} from './login.js'
import {Story} from './story_react.js'
import {getStoriesEditor, setPublic, getCourses, getStory, getLanguageNames} from "../js/api_calls.js";

function CourseList(props) {
    const courses = useDataFetcher(getCourses);
    if(courses === undefined)
        return <div id="languages"><Spinner /></div>;
    return <div id="languages">
        {courses.map((course, index) =>
            <div key={index}>
                <a className="course_selection_button"
                   href={`editor_overview.html?lang=${course.learningLanguage}&lang_base=${course.fromLanguage}`}
                   onClick={(e) => {e.preventDefault(); props.setCourse([course.learningLanguage, course.fromLanguage])}}
                >
                    <span className="course_count">{course.count}</span>
                    <Flag language_data={props.language_data} lang={course.learningLanguage}/>
                    <span>{`${course.learningLanguageName} [${course.fromLanguage}]`}</span>
                </a>
            </div>
        )}
    </div>
}

export function Overview(props) {
    let [lang, lang_base] = props.course;
    const [stories, storiesRefetch] = useDataFetcher2(getStoriesEditor, [lang, lang_base]);
    const [language_data, language_dataRefetch] = useDataFetcher2(getLanguageNames, [lang, lang_base]);


    let [username, doLogin, doLogout] = useUsername();

    function pad(x) {
        if(x < 10)
            return <><>&nbsp;</><>{x}</></>;
        return x;
    }

    async function togglePublic(story) {
        if(confirm(`Do you want to ${story.public ? "hide" : "publish"} the story \"${story.name_base}\"?`)) {
            console.log("set public")
            let response = await setPublic(story.id, !story.public ? 1 : 0);
            console.log("response")
            if(response.status === 200) {
                await storiesRefetch();
            }
        }
    }

    return <div>
        <div id="header_index">
            <div id="header_left" style={{display: "inline-block"}}>
                <div id="button_new" className="button"
                    onClick={() => {location.href = 'editor.html?lang='+lang+'&lang_base='+lang_base}}
                    style={{float: "left", display: "inline-block"}}>New Story
                </div>
                <div id="button_import" className="button"
                    onClick={() => {location.href = 'editor_import.html?lang='+lang+'&lang_base='+lang_base}}
                    style={{float: "left", display: "inline-block"}}>Import Story
                </div>
                <a href="documentation.html">Documentation</a>
            </div>
            <Login useUsername={[username, doLogin, doLogout]} />
        </div>
        <div id="main" style={{display: "grid", gridTemplateColumns: "250px auto 250px"}}>
            <CourseList language_data={language_data} setCourse={props.setCourse}/>
        <div>

        <h1 id="title">{(lang && language_data) ? `Editor - Stories - ${language_data[lang].name} - (from ${language_data[lang_base].name})` : "Editor - Stories"}</h1>
        { lang === undefined ? <p id="no_stories">Click on one of the courses to display its stories.</p>
        : stories === undefined ? <Spinner />
        : <table id="story_list" style={{display: "inline-block"}} className="js-sort-table js-sort-5 js-sort-desc"
               data-js-sort-table="true">
            <thead>
            <tr>
                <th style={{borderRadius: "10px 0 0 0"}} data-js-sort-colnum="0">Set</th>
                <th colSpan="2" data-js-sort-colnum="1">Name</th>
                <th style={{textAlign: "right"}} data-js-sort-colnum="3">XP</th>
                <th data-js-sort-colnum="4">Author</th>
                <th data-js-sort-colnum="5" className="js-sort-active">Creation</th>
                <th data-js-sort-colnum="6">Change</th>
                <th style={{textAlign: "center"}} data-js-sort-colnum="7">Done</th>
                <th style={{borderRadius: "0 10px 0 0"}} data-js-sort-colnum="8">Public</th>
            </tr>
            </thead>
            <tbody>
            {stories.map(story =>
                <tr key={story.id}>
                    <td><span><b>{pad(story.set_id)}</b>&nbsp;-&nbsp;{pad(story.set_index)}</span></td>
                    <td width="30px"><img src={story.image} width="30px" /></td>
                    <td><a href={`editor.html?story=${story.id}&lang=${lang}&lang_base=${lang_base}`}>{story.name_base}</a></td>
                    <td style={{textAlign: "right"}}>+{story.xp}xp</td>
                    <td>{story.username}</td>
                    <td>{story.date}</td>
                    <td>{story.change_date}</td>
                    <td style={{textAlign: "right"}}><span>{story.count}x&nbsp;</span><a
                        href={`story.html?test&story=${story.id}&lang=${lang}&lang_base=${lang_base}`}>[test]</a></td>
                    <td style={{textAlign: "right"}}>
                        <label className="switch" onClick={(e)=>{e.preventDefault(); togglePublic(story)}}>
                            <input type="checkbox" checked={story.public ? "checked" : ""} readOnly="readOnly"/>
                            <span className="slider round" />
                        </label>
                    </td>
                </tr>
            )}
            </tbody>
        </table>
         }
        </div>
    </div>
    </div>
}

function getEditor(ref) {
//    if(ref.editor)
//        return ref.editor;

    var langTools = ace.require("ace/ext/language_tools");
    var editor = ace.edit(ref.current);
//    ref.editor = editor;

    editor.session.setMode("ace/mode/javascript-custom");
    editor.setOptions({
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true
    });
    editor.setTheme("ace/theme/dracula");

    var myCompleter = {
        getCompletions: function(editor, session, pos, prefix, callback) {
            var wordList = ["gh"];
            callback(null, wordList.map(function(word) {
                return {
                    caption: word,
                    value: word
                };
            }));
        }
    };
    langTools.addCompleter(myCompleter);

    editor.session.setUseWrapMode(true);
    editor.resize();
    window.editor = editor;

    editor.commands.addCommand({
        name: 'compile',
        bindKey: {win: 'Ctrl-Enter',  mac: 'Command-Enter'},
        exec: function(editor) {
            updateStoryDisplay();
        },
        readOnly: true // false if this command should not apply in readOnly mode
    });

    editor.commands.addCommand({
        name: 'save',
        bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
        exec: function(editor) {
            saveStory();
        },
        readOnly: true // false if this command should not apply in readOnly mode
    });

    editor.commands.addCommand({
        name: 'tilde',
        bindKey: {win: 'Shift-Space',  mac: 'Shift-Space'},
        exec: function(editor) {
            editor.insert("~")
        },
        readOnly: true // false if this command should not apply in readOnly mode
    });

    editor.commands.addCommand({
        name: 'speaker',
        bindKey: {win: '>',  mac: '>'},
        exec: function(editor) {
            if(rtl)
                editor.insert("\u2067")
            editor.insert(">")
        },
        readOnly: true // false if this command should not apply in readOnly mode
    });
    /*
    editor.commands.addCommand({
        name: 'accent',
        bindKey: {win: '*',  mac: '*'},
        exec: function(editor) {
            //editor.navigateLeft();
            editor.insert("́")
            //editor.navigateRight();
        },
        readOnly: true // false if this command should not apply in readOnly mode
    });
    */
    let dirty = false;
    editor.getSession().on('change', function() {
        dirty = true;
    });

    return editor;
}

function EditorText(props) {
    const inputEl = React.useRef(document.createElement("div"));
    React.useEffect(()=>{
        console.log("use effect", inputEl.current)
        getEditor(inputEl);
        return () => {
            console.log("used effect")
            getEditor(inputEl);
        }
    })
/*    const refEditor = React.useRef();
    console.log("refEditor.current", refEditor.current, );
    if(!refEditor.current) {
        refEditor.current = getEditor(inputEl);
    }*/
    return <div ref={inputEl} style={{height: "500px"}} />;
}

function Editor(props) {
    //const story = useDataFetcher(GHet, [props.story]);
    
    return <div style={{paddingTop: "0px", display: "grid", gridTemplateColumns: "50% 50%"}}>
        <div>
            <EditorText story={props.story} />
        </div>
        <div style={{background: "white", height: "100vh", overflow: "scroll"}}>
            <div id="main" style={{marginTop: "80px"}}>

                <div id="story">

                </div>
            </div>
            <div id="footer" style={{left: "50vw", right: "0px", width: "50%"}}>
                <div id="button_save" className="button" onClick="saveStory();" style={{float: "left"}}><img
                    src="Spinner-1s-40px.svg" height="15px" />save</div>
                <div id="button_audio" className="button" onClick="generateAudio();" style={{float: "left", display: "none"}}>
                    <img src="Spinner-1s-40px.svg" height="15px" />generate Audio</div>
                <div id="button_test" className="button" onClick="test();">test</div>
                <div id="button_reload" className="button" onClick="updateStoryDisplay();">update</div>
            </div>
        </div>
    </div>
}

function EditorOverview(props) {
    let urlParams = new URLSearchParams(window.location.search);
    const [story, setStory] = React.useState(urlParams.get("story") || null);
    const [course, setCourse] = React.useState([urlParams.get("lang") || undefined, urlParams.get("lang_base") || undefined]);

    function changeStory(id) {
        setStory(id);
        if(id) {
            ;//history.pushState({story: id}, "Story" + id, `story.html?story=${id}`);
            dispatchEvent(new CustomEvent('progress_changed', {detail: id}));
        }
        else {
            doSetCourse(course);
        }
    }
    function doSetCourse(course) {
        if(course[0] === undefined)
            ;//history.pushState({course: course}, "Language"+course, `index.html`);
        else
            ;//history.pushState({course: course}, "Language"+course, `index.html?lang=${course[0]}&lang_base=${course[1]}`);
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
    //return <Editor story={story}/>
    return <Overview course={course} setCourse={doSetCourse} onStartStory={changeStory} />
    if(story === null)
        return <IndexContent course={course} setCourse={doSetCourse} onStartStory={changeStory} />
    return <Story story={story} onQuit={()=>{changeStory(null)}} />
}

window.addEventListener("DOMContentLoaded", () => {
    ReactDOM.render(
        <EditorOverview />,
        document.getElementById('root')
    );
})
