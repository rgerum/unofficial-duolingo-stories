import React from 'react';
import ReactDOM from "react-dom";

import {basicSetup, EditorState, EditorView} from "@codemirror/basic-setup";
import {EditorSelection} from "@codemirror/state";

import {Story, Flag} from "story-component";

import {Cast} from "./react/cast";
import {useDataFetcher2, LoggedInButton} from "story-component";
import {deleteStory, getAvatars, getImage, getLanguageName, getStory, setStory} from "./api_calls.mjs";

import {processStoryFile} from "./story-editor/syntax_parser_new.mjs";
import {example, highlightStyle} from "./story-editor/parser.mjs";
import {addScrollLinking} from "./story-editor/scroll_linking";
import {add_resize} from "./story-editor/editor-resize";
import {BrowserRouter, useParams, useNavigate} from "react-router-dom";
import {SoundRecorder} from "./sound-recorder";


window.EditorView = EditorView
window.EditorSelection = EditorSelection

window.editorShowTranslations = false
window.editorShowSsml = false
function StoryEditorHeader(props) {
    const [show_trans, set_show_trans] = React.useState(window.editorShowTranslations);
    function do_set_show_trans() {
        let value = !show_trans;
        const event = new CustomEvent("editorShowTranslations", {
            detail: {show: value}
        });
        window.dispatchEvent(event);
        window.editorShowTranslations = value
        set_show_trans(value);
        window.requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("resize")));
    }
    const [show_ssml, set_show_ssml] = React.useState(window.editorShowSsml);
    function do_set_show_ssml() {
        let value = !show_ssml;
        const event = new CustomEvent("editorShowSsml", {
            detail: {show: value}
        });

        window.dispatchEvent(event);
        window.editorShowSsml = value
        set_show_ssml(value);
        window.requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("resize")));
    }

    const [language, ] = React.useState(props.story_data.learningLanguage || undefined);
    const [language2, ] = React.useState(props.story_data.fromLanguage || undefined);
    const [language_data, ] = useDataFetcher2(getLanguageName, [language]);
    const [language_data2, ] = useDataFetcher2(getLanguageName, [language2]);

    if(language_data === undefined || language_data2 === undefined)
        return <></>
    return <><div className="AvatarEditorHeader">
        <div id="button_back" className="editor_button" onClick={window.button_back} style={{paddingLeft: 0}}>
            <div><img alt="icon back" src="/icons/back.svg" /></div>
            <span>Back</span>
        </div>
        <b>Story-Editor</b>
        <Flag iso={language_data.short} width={40} flag={language_data.flag} flag_file={language_data.flag_file}/>
        <Flag iso={language_data2.short} width={40*0.9} className={"flag_sub"} flag={language_data2.flag} flag_file={language_data2.flag_file}/>
        <span className={"AvatarEditorHeaderFlagname"}>{`${language_data.name} (from ${language_data2.name})`}</span>
        <img alt="story title" width="50px" src={`https://stories-cdn.duolingo.com/image/${story_data.image}.svg`} style={{marginLeft: "auto"}} />
        <span className={"AvatarEditorHeaderFlagname"}>{props.story_data.name}</span>

        <div style={{marginLeft: "auto"}}  id="button_delete" className="editor_button" onClick={window.button_delete}>
            <div><img alt="icon save" src="/icons/delete.svg" /></div>
            <span>Delete</span>
        </div>
        <div className="editor_button" onClick={(e) => {
            e.preventDefault();
            do_set_show_trans()
        }}>
            <label className="switch">
                <input type="checkbox" checked={show_trans ? "checked" : ""}
                       readOnly="readOnly"/>
                <span className="slider round"/>
            </label>
            <span>Hints</span>
        </div>
        <div className="editor_button" onClick={(e) => {
            e.preventDefault();
            do_set_show_ssml()
        }}>
            <label className="switch">
                <input type="checkbox" checked={show_ssml ? "checked" : ""}
                       readOnly="readOnly"/>
                <span className="slider round"/>
            </label>
            <span>Audio</span>
        </div>
        <div id="button_save" className="editor_button" onClick={window.button_save}>
            <div><img alt="icon save" src="/icons/save.svg" /></div>
            <span>Save</span>
        </div>
        <LoggedInButton username={props.username} doLogout={props.doLogout}/>
    </div></>
}


export function EditorNode(props) {
    let urlParams = new URLSearchParams(window.location.search);
    let {story} = useParams();
    let navigate = useNavigate();

    React.useEffect(() => {
        MountEditor(story, navigate, props);
    }, []);// <SoundRecorder/>
    return <div id="body">
        <div id="toolbar">
        </div>
        {urlParams.get("beta") ? <SoundRecorder/> : <></>}
        <div id="root">
            <svg id="margin">
                <path d=""></path>

            </svg>
            <div id="editor"></div>
            <svg id="margin2"></svg>
            <div id="preview"></div>
        </div>
    </div>
}


function MountEditor(story_id, navigate, props) {
    let createScrollLookUp = () => {
        window.dispatchEvent(new CustomEvent("resize"));
    };
    add_resize();

    let unsaved_changes = false;

    window.hideWarning = false;
    window.addEventListener('beforeunload', (event) => {
        if (unsaved_changes) {
            event.preventDefault();
            event.returnValue = 'You have unsaved changed, are you sure you want to quit?';
        }
    });

    window.button_back = function() {
        navigate(`/course/${story_data.course_id}`);
    }

    async function a() {
        window.button_delete = async function() {
            if(confirm("Are you sure that you want to delete this story?")) {
                document.querySelector("#button_delete span").innerText = "Deleting";
                try {
                    await deleteStory({id: story_data.id, course_id: story_data.course_id, text: editor_text, name: story_meta.fromLanguageName});
                    navigate(`/course/${story_data.course_id}`);
                }
                catch (e) {
                    document.querySelector("#button_delete span").innerText = "Delete";
                    window.alert("Story could not be deleted");
                }
            }
        }
        window.button_save = function() {
            let save = async function() {
                try {
                    document.querySelector("#button_save span").innerText = "Saving";
                    let data = {
                        id: story_data.id,
                        duo_id: story_data.duo_id,
                        name: story_meta.fromLanguageName,
                        image: story_meta.icon,
                        set_id: parseInt(story_meta.set_id),
                        set_index: parseInt(story_meta.set_index),
                        course_id: story_data.course_id,
                        text: editor_text,
                        json: JSON.stringify(story),
                    }

                    await setStory(data)
                    unsaved_changes = false;
                }
                catch (e) {
                    window.alert("Story could not be saved.")
                }
                document.querySelector("#button_save span").innerText = "Save";
            }
            save();
        }

        let story = undefined;
        let story_meta = undefined;
        let last_lineno = undefined;
        let lineno = undefined;
        let editor_state = undefined;
        let state = undefined;
        let editor_text = undefined;

        let story_data = await getStory(story_id);
        // cache the image
        getImage(story_data.image)
        let avatar_names_list = await getAvatars(story_data.learningLanguage)
        let avatar_names = {}
        for(let avatar of avatar_names_list) {
            avatar_names[avatar.avatar_id] = avatar;
        }
        window.story_data = story_data;

        ReactDOM.render(
            <React.StrictMode>
                <StoryEditorHeader story_data={story_data} username={props.username} doLogout={props.doLogout}/>
            </React.StrictMode>,
            document.getElementById('toolbar')
        );

        function updateDisplay() {
            if(state === undefined)
                return
            if (story === undefined) {
                last_lineno = lineno;
                editor_text = state.doc.toString();
                [story, story_meta] = processStoryFile(editor_text, story_data.id, avatar_names);
                let image = getImage(story_meta.icon)
                story.illustrations = {
                    active: image.active,
                    gilded: image.gilded,
                    locked: image.locked,
                }

                window.story = story;
                window.getImage = getImage;
                window.story_meta = story_meta;

                ReactDOM.render(
                    <React.StrictMode>
                        <BrowserRouter>
                        <Cast id={story_data.id} story_meta={story_meta} learningLanguage={story_data.learningLanguage}/>
                        <Story editor={editor_state} story={story}/>
                        </BrowserRouter>
                    </React.StrictMode>,
                    document.getElementById('preview')
                );
                createScrollLookUp();
                last_lineno = lineno;
            }
        }

        window.setInterval(updateDisplay, 1000);

        let last_event_lineno
        let sync = EditorView.updateListener.of((v) => {
            lineno = v.state.doc.lineAt(v.state.selection.ranges[0].from).number;
            if(last_event_lineno !== lineno) {
                last_event_lineno = lineno;
                const event = new CustomEvent("editorLineChanged", {
                    detail: {
                        lineno: lineno
                    }
                });

                window.dispatchEvent(event);
            }

            editor_state = {
                line_no: lineno,
                view: view,
                select: (line, scroll) => {
                    let pos = view.state.doc.line(parseInt(line)).from;
                    view.dispatch(view.state.update({
                        selection: EditorSelection.cursor(pos),
                        scrollIntoView: scroll,
                    }));
                }
            }
            state = v.state;
            if (v.docChanged) {
                unsaved_changes = true;
                story = undefined;
                last_lineno = undefined;
            }

        })

        let theme = EditorView.theme({
            ".cm-here": {color: "darkorange"},
            ".cm-name": {color: "orange"},
            ".cm-invalid": {color: "green"},
        });


        let startState = EditorState.create({
            doc: story_data.text || "",
            extensions: [basicSetup, sync, theme, example(), highlightStyle]
        })

        window.view = new EditorView({
            state: startState,
            parent: document.getElementById('editor')
        })

        addScrollLinking(view);
    }
    a()
}