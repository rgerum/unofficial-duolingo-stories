import React from 'react';
import ReactDOM from 'react-dom';
import {Story, Cast} from "./story_react";
import {EditorOverviewLogin} from "./editor"
import {AvatarMain} from "./avatar_editor";
import {getAvatars, getImage, getLanguageName, getStory, setStory} from "./api_calls.mjs";

import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import {HighlightStyle, tags as t} from "@codemirror/highlight"
import {processStoryFile} from "./syntax_parser_new.mjs";
import {EditorSelection} from "@codemirror/state";

import {example} from "./parser.mjs"
import {useDataFetcher2} from "./hooks";
import {Flag} from "./react/flag";
window.EditorView = EditorView
window.EditorSelection = EditorSelection
let urlParams = new URLSearchParams(window.location.search);

window.editorShowTranslations = false
window.editorShowSsml = false
export function StoryEditorHeader(props) {
    const [show_trans, set_show_trans] = React.useState(window.editorShowTranslations);
    function do_set_show_trans() {
        let value = !show_trans;
        const event = new CustomEvent("editorShowTranslations", {
            detail: {show: value}
        });
        window.dispatchEvent(event);
        window.editorShowTranslations = value
        set_show_trans(value);
        requestAnimationFrame(createScrollLookUp);
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
        requestAnimationFrame(createScrollLookUp);
    }

    const [language, setLanguage] = React.useState(props.story_data.learningLanguage || undefined);
    const [language2, setLanguage2] = React.useState(props.story_data.fromLanguage || undefined);
    const [language_data, _] = useDataFetcher2(getLanguageName, [language]);
    const [language_data2, __] = useDataFetcher2(getLanguageName, [language2]);

    if(language_data === undefined || language_data2 === undefined)
        return <></>
    return <><div className="AvatarEditorHeader">
        <div id="button_back" className="editor_button" onClick={window.button_back} style={{paddingLeft: 0}}>
            <div><img alt="icon back" src="icons/back.svg" /></div>
            <span>Back</span>
        </div>
        <b>Story-Editor</b>
        <Flag flag={language_data.flag} flag_file={language_data.flag_file}/>
        <Flag className={"flag_sub"} flag={language_data2.flag} flag_file={language_data2.flag_file}/>
        <span className={"AvatarEditorHeaderFlagname"}>{`${language_data.name} (from ${language_data2.name})`}</span>
        <img alt="story title" width="50px" src={`https://stories-cdn.duolingo.com/image/${story_data.image}.svg`} style={{marginLeft: "auto"}} />
        <span className={"AvatarEditorHeaderFlagname"}>{props.story_data.name}</span>
        <div style={{marginLeft: "auto"}} className="editor_button" onClick={(e) => {
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
            <div><img alt="icon save" src="icons/save.svg" /></div>
            <span>Save</span>
        </div>
    </div></>
}

if(!urlParams.get("story") && !urlParams.get("language")) {
    ReactDOM.render(
        <React.StrictMode>
            <EditorOverviewLogin />
        </React.StrictMode>,
        document.getElementById('body')
    );
}
else if(!urlParams.get("story")) {
    ReactDOM.render(
        <React.StrictMode>
            <AvatarMain />
        </React.StrictMode>,
        document.getElementById('body')
    );
}
else {
    let unsaved_changes = false;

    window.hideWarning = false;
    window.addEventListener('beforeunload', (event) => {
        if (unsaved_changes) {
            event.preventDefault();
            event.returnValue = 'You have unsaved changed, are you sure you want to quit?';
        }
    });


    console.log("urlParams", urlParams)
    let editor = document.getElementById("editor");
    let preview = document.getElementById("preview");
    let svg_parent = document.getElementById("margin");

    window.scroll_lookup = [];

    function update_lines() {
        let svg_element = 0;
        let width1 = svg_parent.getBoundingClientRect().width * 0.48
        let width1b = svg_parent.getBoundingClientRect().width * 0.50
        let width2 = svg_parent.getBoundingClientRect().width * 0.52
        let width3 = svg_parent.getBoundingClientRect().width
        let height = svg_parent.getBoundingClientRect().height

        let pairs = []
        let pairs2 = []
        let path = "M0,0 ";
        for(let element of document.querySelectorAll("div[lineno]")) {
            let new_lineno = parseInt(element.attributes.lineno.value);
            let new_top = element.getBoundingClientRect().top  - svg_parent.getBoundingClientRect().top - 10;// - preview.scrollTop - preview.getBoundingClientRect().top
            let new_linetop = (4+new_lineno)*26.6 - editor.scrollTop - svg_parent.getBoundingClientRect().top - editor.getBoundingClientRect().top
            if(svg_element % 2 === 0)
                path += `L0,${new_linetop} L ${width1},${new_linetop} C${width1b},${new_linetop} ${width1b},${new_top} ${width2},${new_top} L${width3},${new_top}`;
            else
                path += `L${width3},${new_top} L ${width2},${new_top} C${width1b},${new_top} ${width1b},${new_linetop} ${width1},${new_linetop} L0,${new_linetop}`;
            element.getBoundingClientRect().top
            svg_element += 1;
            pairs.push([new_linetop, new_top])
            pairs2.push([new_lineno, new_top])
        }
        if(svg_element % 2 === 1)
            path += `L${width3},${height} L ${0},${height}`;
        svg_parent.children[0].setAttribute("d", path)
    }

    let last_editor_scroll_pos = 0;
    document.getElementById("editor").addEventListener('scroll', function(e) {
        requestAnimationFrame(()=>{
        if(last_editor_scroll_pos === editor.scrollTop)
            return
        last_editor_scroll_pos = editor.scrollTop;

        let offset_lines = 1;
        let o = editor.getBoundingClientRect().height/2
        let target_equal_lineno = (editor.scrollTop-4 + o)/26.6+offset_lines;
        let pairss = window.line_map;
        if(pairss === undefined)
            return;
        for(let i = 0; i < pairss.length-1; i+= 1) {
            let [x1, y1] = pairss[i];
            let [x2, y2] = pairss[i+1];
            if(x1 <= target_equal_lineno && target_equal_lineno < x2) {
                let f = (target_equal_lineno-x1)/(x2-x1);
                let offsetx = y1+f*(y2-y1);
                last_preview_scroll_pos = parseInt(offsetx - o);
                preview.scrollTo(0, offsetx - o);
                break
            }
        }

        update_lines();
        })

    });
    let last_preview_scroll_pos = 0;
    preview.addEventListener('scroll', function(e) {
        requestAnimationFrame(()=>{
            if(last_preview_scroll_pos === preview.scrollTop)
                return
            last_preview_scroll_pos = preview.scrollTop;

            let offset_lines = 1;
            let o = preview.getBoundingClientRect().height/2
            //let target_equal_lineno = (editor.scrollTop-4 + o)/26.6+offset_lines;
            let target_equal_pos = preview.scrollTop + o;
            let pairss = window.line_map
            for(let i = 0; i < pairss.length-1; i+= 1) {
                let [x1, y1] = pairss[i];
                let [x2, y2] = pairss[i+1];
                if(y1 <= target_equal_pos && target_equal_pos < y2) {
                    let f = (target_equal_pos-y1)/(y2-y1);
                    let offsetx_lineno = x1+f*(x2-x1);
                    let offsetx = (offsetx_lineno - offset_lines) * 26.6 - o + 4
                    last_editor_scroll_pos = parseInt(offsetx);
                    editor.scrollTo(0, offsetx);
                    break
                }
            }

            update_lines();
        })

    });
    function createScrollLookUp() {
        let line_map = []
        let preview = document.getElementById("preview");
        window.line_map = [[0, 0]]
        for(let element of document.querySelectorAll("div[lineno]")) {
            let new_lineno = parseInt(element.attributes.lineno.value);
            let new_top = element.getBoundingClientRect().top + preview.scrollTop - preview.getBoundingClientRect().top - 10;
            window.line_map.push([new_lineno, new_top])
        }
        update_lines();
        return line_map;
    }
    window.addEventListener("resize", function () {
        createScrollLookUp();
    });

    window.button_back = function() {
        window.location.href = "?course="+story_data.course_id;
    }

    async function a() {

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

        let story_data = await getStory(urlParams.get("story"));
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
                <StoryEditorHeader story_data={story_data}/>
            </React.StrictMode>,
            document.getElementById('toolbar')
        );

        function updateDisplay() {
            if(state === undefined)
                return
            //last_lineno = lineno;
            if (story === undefined) {
                last_lineno = lineno;
                //console.log("updateDisplay", last_lineno !== lineno, last_avatar !== Object.keys(window.character_avatars).length, story === undefined)
                if (story === undefined) {
                    console.log("parse Story", "story_data", story_data)
                    editor_text = state.doc.toString();
                    [story, story_meta] = processStoryFile(editor_text, story_data.id, avatar_names);
                    let image = getImage(story_meta.icon)
                    story.illustrations = {
                        active: image.active,
                        gilded: image.gilded,
                        locked: image.locked,
                    }
                    //story.learningLanguage = "es",
                    //    "fromLanguage": "en",
                    /*
                    "illustrations": {
    "active": "https://stories-cdn.duolingo.com/image/9ac312d372abe49d99606848f5a7a8414143346d.svg",
    "gilded": "https://stories-cdn.duolingo.com/image/7bd913249101cb2a56b87e005d364a5810db108e.svg",
    "locked": "https://stories-cdn.duolingo.com/image/ae651762db4b1e5669394228804b7d6daa7c1a6b.svg"
  }
                     */
                }
                window.story = story;
                window.getImage = getImage;
                window.story_meta = story_meta;

                ReactDOM.render(
                    <React.StrictMode>
                        <Cast story_meta={story_meta} learningLanguage={story_data.learningLanguage}/>
                        <Story editor={editor_state} story={story}/>
                    </React.StrictMode>,
                    document.getElementById('preview')
                );
                window.scroll_lookup = createScrollLookUp();
                last_lineno = lineno;
                if(0) {
                    document.getElementsByClassName("story_selection")[0]?.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                        inline: "nearest"
                    })
                    for (let element of document.querySelectorAll("div[lineno]")) {
                        element.onclick = (e) => {
                            console.log("clicked", element)
                            let pos = view.state.doc.line(parseInt(element.attributes.lineno.value) + 1).from;
                            view.dispatch(view.state.update({
                                selection: EditorSelection.cursor(pos),
                                scrollIntoView: true,
                            }));
                            //view.scrollPosIntoView(view.state.doc.line(parseInt(element.attributes.lineno.value)).from)
                        }
                    }
                }
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

            editor_state = {line_no: lineno}
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

        const chalky = "#e5c07b",
            coral = "#e06c75",
            cyan = "#56b6c2",
            invalid = "#ffffff",
            ivory = "#abb2bf",
            stone = "#7d8799", // Brightened compared to original to increase contrast
            malibu = "#61afef",
            sage = "#98c379",
            whiskey = "#d19a66",
            violet = "#c678dd"
        /*
            darkBackground = "#21252b",
            highlightBackground = "#2c313a",
            background = "#282c34",
            tooltipBackground = "#353a42",
            selection = "#3E4451",
            cursor = "#528bff"
         */

        const color_even = "#009623",
            color_odd = "#00389d"

        let highlightStyle = HighlightStyle.define([
            // STATE_TRANS_EVEN
            {tag: t.propertyName, color: color_even, fontStyle: "italic", opacity: 0.5},
            // STATE_TRANS_ODD
            {tag: t.macroName, color: color_odd, fontStyle: "italic", opacity: 0.5},
            // STATE_TEXT_EVEN
            {tag: t.tagName, color: color_even},
            // STATE_TEXT_ODD
            {tag: t.name, color: color_odd},

            // STATE_TEXT_HIDE_EVEN
            {tag: t.className, color: color_even, opacity: 0.4, borderBottom: "2px solid black"}, // textDecoration: "underline",
            // STATE_TEXT_HIDE_ODD
            {tag: t.typeName, color: color_odd, opacity: 0.4, borderBottom: "2px solid black"},
            // STATE_TEXT_HIDE_NEUTRAL
            {tag: t.changed, opacity: 0.4, borderBottom: "2px solid black"},

            // STATE_TEXT_BUTTON_EVEN
            {tag: t.number, color: color_even, background: "#c8c8c8", borderRadius: "10px"},
            // STATE_TEXT_BUTTON_ODD
            {tag: t.labelName, color: color_odd, background: "#c8c8c8", borderRadius: "10px"},

            // STATE_TEXT_HIDE_BUTTON_EVEN
            {tag: t.meta, color: color_even, borderBottom: "2px solid black", background: "#c8c8c8", borderRadius: "10px", opacity: 0.4},
            // STATE_TEXT_HIDE_BUTTON_ODD
            {tag: t.comment, color: color_odd, borderBottom: "2px solid black", background: "#c8c8c8", borderRadius: "10px", opacity: 0.4},
            // STATE_TEXT_BUTTON_RIGHT_EVEN
            {tag: t.modifier, color: "black", background: "#9bd297", borderRadius: "10px"},

            // STATE_BLOCK_TYPE
            {tag: t.keyword, color: violet},
            // STATE_ERROR
            {tag: [t.deleted, t.character], color: coral, textDecoration: "line-through",},
            {
                tag: [t.function(t.variableName)],
                color: malibu
            },
            // STATE_AUDIO
            {tag: [t.color, t.constant(t.name), t.standard(t.name)], color: whiskey},
            {
                tag: [t.definition(t.name), t.separator],
                color: ivory
            },
            {
                tag: [t.annotation, t.self, t.namespace],
                color: chalky
            },
            {
                tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
                color: cyan
            },

            {
                tag: t.strong,
                fontWeight: "bold"
            },
            {
                tag: t.emphasis,
                fontStyle: "italic"
            },
            {
                tag: t.strikethrough,
                textDecoration: "line-through"
            },
            {
                tag: t.link,
                color: stone,
                textDecoration: "underline"
            },
            {
                tag: t.heading,
                fontWeight: "bold",
                color: coral
            },
            {
                tag: t.atom
            },
            {
                tag: [t.bool, t.special(t.variableName)],
                color: whiskey
            },
            {
                tag: [t.processingInstruction, t.string, t.inserted],
                color: sage
            },
            {
                tag: t.invalid,
                color: invalid
            },
        ])

        let startState = EditorState.create({
            doc: story_data.text || "",
            extensions: [basicSetup, sync, theme, example(), highlightStyle]
        })

        window.view = new EditorView({
            state: startState,
            parent: document.getElementById('editor')
        })
    }
    a()
}