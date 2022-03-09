import React from 'react';
import ReactDOM from 'react-dom';
import {Story} from "./story_react";
import {EditorOverview} from "./editor"
import {getStory, setStory} from "./api_calls.mjs";

import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import {HighlightStyle, tags as t} from "@codemirror/highlight"
import {processStoryFile} from "./syntax_parser_new.mjs";
import { Extension, EditorSelection, SelectionRange, Facet, Compartment} from "@codemirror/state";

import {example} from "./parser.mjs"
window.EditorView = EditorView
window.EditorSelection = EditorSelection
let urlParams = new URLSearchParams(window.location.search);

if(!urlParams.get("story")) {
    document.getElementById('button_save').style.display = "none"
    document.getElementById('button_back').style.display = "none"
    ReactDOM.render(
        <React.StrictMode>
            <EditorOverview/>
        </React.StrictMode>,
        document.getElementById('root')
    );
}
else {
    let editor = document.getElementById("editor");
    let preview = document.getElementById("preview");
    let svg_parent = document.getElementById("margin");

    window.scroll_lookup = [];

    function update_lines() {
        let svg_element = 0;
        let width1 = svg_parent.getBoundingClientRect().width * 0.48
        let width1b = svg_parent.getBoundingClientRect().width * 0.50
        let width2 = svg_parent.getBoundingClientRect().width * 0.52
        let width3 = svg_parent.getBoundingClientRect().width * 1.00
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
        let pairss = window.line_map
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
        window.line_map = []
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

    document.getElementById('button_import').style.display = "none"

    window.button_back = function() {
        window.location.href = "?";
    }

    async function a() {

        window.button_save = function() {
            let save = async function() {
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
        window.story_data = story_data
        let last_avatar = undefined;

        function updateDisplay() {
            if(state === undefined)
                return
            //last_lineno = lineno;
            if (story === undefined  || last_avatar !== Object.keys(window.character_avatars).length) {
                last_lineno = lineno;
                console.log("updateDisplay", last_lineno !== lineno, last_avatar !== Object.keys(window.character_avatars).length, story === undefined)
                if (story === undefined || last_avatar !== Object.keys(window.character_avatars).length) {
                    console.log("parse Story")
                    editor_text = state.doc.toString();
                    [story, story_meta] = processStoryFile(editor_text, story_data.id);
                }
                last_avatar = Object.keys(window.character_avatars).length;
                window.story = story;

                ReactDOM.render(
                    <React.StrictMode>
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

        const color_even = "#00389d",
            color_odd = "#009623"

        let highlightStyle = HighlightStyle.define([
            {tag: t.propertyName, color: color_even, fontStyle: "italic", opacity: 0.5},
            {tag: t.macroName, color: color_odd, fontStyle: "italic", opacity: 0.5},
            {tag: t.tagName, color: color_even},
            {tag: t.name, color: color_odd},

            {tag: t.className, color: color_even, textDecoration: "underline"},
            {tag: t.typeName, color: color_odd, textDecoration: "underline"},

            {tag: t.number, color: color_even, background: "#c8c8c8", borderRadius: "10px"},
            {
                tag: t.labelName,
                color: color_even,
                textDecoration: "underline",
                background: "#c8c8c8",
                borderRadius: "10px"
            },
            {tag: t.modifier, color: color_even, background: "#9bd297", borderRadius: "10px"},


            {
                tag: t.keyword,
                color: violet
            },
            {
                tag: [t.deleted, t.character],
                color: coral,
                textDecoration: "line-through",
            },
            {
                tag: [t.function(t.variableName)],
                color: malibu
            },
            {
                tag: [t.color, t.constant(t.name), t.standard(t.name)],
                color: whiskey
            },
            {
                tag: [t.definition(t.name), t.separator],
                color: ivory
            },
            {
                tag: [t.changed, t.annotation, t.self, t.namespace],
                color: chalky
            },
            {
                tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
                color: cyan
            },
            {
                tag: [t.meta, t.comment],
                color: stone
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

        let view = new EditorView({
            state: startState,
            parent: document.getElementById('editor')
        })
        window.view = view;
    }
    a()
}