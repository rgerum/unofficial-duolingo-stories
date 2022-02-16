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
            if (last_lineno !== lineno || last_avatar !== Object.keys(window.character_avatars).length) {
                console.log("updateDisplay", last_lineno !== lineno, last_avatar !== Object.keys(window.character_avatars).length, story === undefined)
                if (story === undefined || last_avatar !== Object.keys(window.character_avatars).length) {
                    console.log("parse Story")
                    editor_text = state.doc.toString();
                    [story, story_meta] = processStoryFile(editor_text);
                }
                last_avatar = Object.keys(window.character_avatars).length;
                window.story = story;

                ReactDOM.render(
                    <React.StrictMode>
                        <Story editor={editor_state} story={story}/>
                    </React.StrictMode>,
                    document.getElementById('preview')
                );
                last_lineno = lineno;
                document.getElementsByClassName("story_selection")[0]?.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"})
                for(let element of document.querySelectorAll("div[lineno]")) {
                    element.onclick = (e) => {
                        console.log("clicked", element)
                        let pos = view.state.doc.line(parseInt(element.attributes.lineno.value)+1).from;
                        view.dispatch(view.state.update({
                            selection: EditorSelection.cursor(pos),
                            scrollIntoView: true,
                        }));
                        //view.scrollPosIntoView(view.state.doc.line(parseInt(element.attributes.lineno.value)).from)
                    }
                }
            }
        }

        window.setInterval(updateDisplay, 1000);

        let sync = EditorView.updateListener.of((v) => {
            lineno = v.state.doc.lineAt(v.state.selection.ranges[0].from).number;
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

        new EditorView({
            state: startState,
            parent: document.getElementById('editor')
        })
    }
    a()
}