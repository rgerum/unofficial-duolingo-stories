import "./story-editor.css"

import React from 'react';
import {useParams, useNavigate, Link} from "react-router-dom";

import {basicSetup, EditorView} from "codemirror";
import {EditorState, EditorSelection} from "@codemirror/state";
import {example, highlightStyle} from "./story-editor/parser.mjs";
import {useScrollLinking} from "./story-editor/scroll_linking";
import {useResizeEditor} from "./story-editor/editor-resize";
//import {SoundRecorder} from "./sound-recorder";

import {LoggedInButton} from 'login';
import {useDataFetcher} from "includes";

import {Story} from "story";
import {Flag} from "ui_elements";
import {Cast} from "./react/cast";
import {processStoryFile} from "./story-editor/syntax_parser_new.mjs";
import {
    deleteStory,
    getAvatarsList,
    getImage,
    getLanguageName,
    getStory,
    setStory
} from "./api_calls.mjs";
import usePrompt from "./usePrompt";


window.editorShowTranslations = false
window.editorShowSsml = false
function StoryEditorHeader({story_data, userdata, unsaved_changes, language_data, language_data2, func_save, func_delete}) {
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

    const [save_text, set_save_text] = React.useState("Save");
    async function Save() {
        try {
            set_save_text("Saving...");
            func_save();
        }
        catch (e) {
            console.log("error save", e);
            window.alert("Story could not be saved.")
        }
        set_save_text("Save");
        document.querySelector("#button_save span").innerText = "Save";
    }
    async function Delete() {
        if(confirm("Are you sure that you want to delete this story?")) {
            document.querySelector("#button_delete span").innerText = "Deleting";
            try {
                func_delete();
            }
            catch (e) {
                console.log("error delete", e);
                document.querySelector("#button_delete span").innerText = "Delete";
                window.alert("Story could not be deleted");
            }
        }
    }

    return <><div className="AvatarEditorHeader">
        <Link id="button_back" className="editor_button" to={`/course/${story_data?.course_id}`} style={{paddingLeft: 0}}>
            <div><img alt="icon back" src="/icons/back.svg" /></div>
            <span>Back</span>
        </Link>
        <b>Story-Editor</b>
        <Flag iso={language_data?.short} width={40} flag={language_data?.flag} flag_file={language_data?.flag_file}/>
        <Flag iso={language_data2?.short} width={40*0.9} className={"flag_sub"} flag={language_data2?.flag} flag_file={language_data2?.flag_file}/>
        {language_data?.name && language_data2?.name ?
        <span className={"AvatarEditorHeaderFlagname"}>{`${language_data?.name} (from ${language_data2?.name})`}</span> : null}
        {story_data?.image ?
            <img alt="story title" width="50px" src={`https://stories-cdn.duolingo.com/image/${story_data?.image}.svg`} style={{marginLeft: "auto"}} />
         :  <img alt="story title" width="50px" src={`/icons/empty_title.svg`} style={{marginLeft: "auto"}} /> }
        <span className={"AvatarEditorHeaderFlagname"}>{story_data?.name}</span>

        <div style={{marginLeft: "auto"}}  id="button_delete" className="editor_button" onClick={Delete}>
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
        <div id="button_save" className="editor_button" onClick={Save}>
            <div><img alt="icon save" src="/icons/save.svg" /></div>
            <span title={unsaved_changes ? "Story contains unsaved changes" : "No unsaved changes."}>{save_text + (unsaved_changes ? "*" : "")}</span>
        </div>
        <LoggedInButton userdata={userdata} page="editor"/>
    </div></>
}

function Editor({story_data, avatar_names, userdata}) {
    const editor = React.useRef();
    const preview = React.useRef();
    const margin = React.useRef();
    const svg_parent = React.useRef();


    const [language_data, set_language_data] = React.useState();
    const [language_data2, set_language_data2] = React.useState();
    React.useEffect(() => {
        async function loadLanguageData() {
            if(!story_data)
                return () => {}
            let language_data = await getLanguageName(story_data.learningLanguage)
            let language_data2 = await getLanguageName(story_data.fromLanguage)
            set_language_data(language_data);
            set_language_data2(language_data2);
            return () => {}
        }
        loadLanguageData();
    }, [story_data])

    const [editor_state, set_editor_state] = React.useState();
    const [story_state, set_story_state] = React.useState();
    const [story_meta, set_story_meta] = React.useState();
    const [view, set_view] = React.useState();

    const [func_save, set_func_save] = React.useState(() => ()=>{});
    const [func_delete, set_func_delete] = React.useState(() => ()=>{});

    const [unsaved_changes, set_unsaved_changes] = React.useState(false);

    const navigate = useNavigate();

    useResizeEditor(editor.current, preview.current, margin.current);
    useScrollLinking(view, preview.current, svg_parent.current);

    usePrompt('You have unsaved changed, are you sure you want to quit?', unsaved_changes);
    let beforeunload = React.useCallback((event) => {
        if (unsaved_changes) {
            event.preventDefault();
            return event.returnValue = 'You have unsaved changed, are you sure you want to quit?';
        }

    }, [unsaved_changes]);

    React.useEffect(() => {
        console.log("liser", unsaved_changes);
        if(!unsaved_changes)
            return;
        console.log("add event liser")
        window.addEventListener('beforeunload', beforeunload)
        return () => window.removeEventListener('beforeunload', beforeunload);
    }, [unsaved_changes]);

    React.useEffect(() => {
        if(!story_data || !avatar_names)
            return undefined;
        let createScrollLookUp = () => {
            window.dispatchEvent(new CustomEvent("resize"));
        };

        let story = undefined;
        let story_meta = undefined;
        let last_lineno = undefined;
        let lineno = undefined;
        let editor_state = undefined;
        let stateX = undefined;
        let editor_text = undefined;

        async function Save() {
            if(story_meta === undefined || story_data === undefined)
                return
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
            set_unsaved_changes(false);
        }
        set_func_save(() => Save);

        async function Delete() {
            if(story_meta === undefined || story_data === undefined)
                return
            await deleteStory({id: story_data.id, course_id: story_data.course_id, text: editor_text, name: story_meta.fromLanguageName});
            navigate(`/course/${story_data.course_id}`);
        }
        set_func_delete(() => Delete)

        function updateDisplay() {
            if(stateX === undefined || story_data === undefined)
                return
            if (story === undefined) {
                last_lineno = lineno;
                editor_text = stateX.doc.toString();
                [story, story_meta] = processStoryFile(editor_text, story_data.id, avatar_names);
                let image = getImage(story_meta.icon)
                story.illustrations = {
                    active: image.active,
                    gilded: image.gilded,
                    locked: image.locked,
                }
                story.learningLanguageRTL = language_data?.rtl;
                story.fromLanguageRTL = language_data2?.rtl;

                set_editor_state(editor_state);
                set_story_state(story);
                set_story_meta(story_meta);

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
            stateX = v.state;
            if (v.docChanged) {
                set_unsaved_changes(true);
                story = undefined;
                last_lineno = undefined;
            }

        })

        let theme = EditorView.theme({
            ".cm-here": {color: "darkorange"},
            ".cm-name": {color: "orange"},
            ".cm-invalid": {color: "green"},
        });

        const state = EditorState.create({
            doc: story_data.text || "",
            extensions: [basicSetup, sync, theme, example(), highlightStyle]
        });
        const view = new EditorView({ state, parent: editor.current });
        set_view(view);

        return () => {
            view.destroy();
        };
    }, [story_data, avatar_names, language_data, language_data2]);

    return (
        <div id="body">
            <div id="toolbar">
                <StoryEditorHeader story_data={story_data} userdata={userdata} unsaved_changes={unsaved_changes}
                                   func_save={func_save} func_delete={func_delete} language_data={language_data} language_data2={language_data2}/>
            </div>
            <div id="root">
                <svg id="margin" ref={svg_parent}>
                    <path d=""></path>

                </svg>
                <div id="editor" ref={editor}></div>
                <svg id="margin2" ref={margin}></svg>
                <div id="preview" ref={preview}>
                    {story_meta && story_data ?
                        <Cast id={story_data.id} story_meta={story_meta} learningLanguage={story_data.learningLanguage}/>
                        : null}
                    {story_state ?
                    <Story editor={editor_state} story={story_state} navigate={navigate}/> : null}
                </div>
            </div>
        </div>

    );
}

export function EditorNode({userdata}) {
    let {story} = useParams();
    const story_data = useDataFetcher(getStory, [parseInt(story)]);
    const avatar_names = useDataFetcher(getAvatarsList, [story_data?.learningLanguage]);

    if(story_data?.error) {
        return <>Error loading story</>
    }
    if(avatar_names?.error) {
        return <>Error loading avatar names</>
    }

    //if(!story_data || !avatar_names)
    //    return <Spinner />
    return <Editor story_data={story_data} avatar_names={avatar_names} userdata={userdata}/>
}
