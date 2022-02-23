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
    window.scroll_lookup = [];
    function map_editor_to_preview(pos) {
        let line = pos/26.6;///26.6;
        let pos1 = Math.floor(line)
        let factor = line % 1;
        console.log(line, pos1, factor, window.scroll_lookup[pos1], factor * (window.scroll_lookup[pos1+1]-window.scroll_lookup[pos1]))
        let new_pos = window.scroll_lookup[pos1] + factor * (window.scroll_lookup[pos1+1]-window.scroll_lookup[pos1])
        return new_pos;
    }
    window.map_editor_to_preview = map_editor_to_preview
    document.getElementById("editor").addEventListener('scroll', function(e) {
        requestAnimationFrame(()=>{
        let editor = document.getElementById("editor");
        let preview = document.getElementById("preview");
        let svg_parent = document.getElementById("margin");

        let offset = 0;//svg_parent.getBoundingClientRect().height*(1.5/4)
        let new_pos = map_editor_to_preview(editor.scrollTop + offset) - offset;///26.6;
        preview.scrollTo(0, new_pos);


        let svg_element = 0;
        let width1 = svg_parent.getBoundingClientRect().width * 0.48
        let width1b = svg_parent.getBoundingClientRect().width * 0.50
        let width2 = svg_parent.getBoundingClientRect().width * 0.52
        let width3 = svg_parent.getBoundingClientRect().width * 1.00
        for(let element of document.querySelectorAll("div[lineno]")) {
            let new_lineno = parseInt(element.attributes.lineno.value);
            let new_top = element.getBoundingClientRect().top  - svg_parent.getBoundingClientRect().top - 10;// - preview.scrollTop - preview.getBoundingClientRect().top
            let new_linetop = (4+new_lineno)*26.6 - editor.scrollTop - svg_parent.getBoundingClientRect().top - editor.getBoundingClientRect().top
            svg_parent.children[svg_element].setAttribute("d", `M0,${new_linetop} L ${width1},${new_linetop} 
                                                                                  C${width1b},${new_linetop} ${width1b},${new_top} ${width2},${new_top} L${width3},${new_top}`)
            element.getBoundingClientRect().top
            svg_element += 1;
        }
        })

    });
    function createScrollLookUp() {
        let line_map = []
        let last_lineno = 0;
        let last_top = 0;
        let svg_element = 0;
        let svg_parent = document.getElementById("margin");
        for(let element of document.querySelectorAll("div[lineno]")) {
            let new_lineno = parseInt(element.attributes.lineno.value);
            let new_top = element.getBoundingClientRect().top + document.getElementById("preview").scrollTop;
            if(svg_parent.children[svg_element] === undefined) {
                let element = document.createElementNS("http://www.w3.org/2000/svg", "path");
                element.setAttribute("line-width", 2)
                element.setAttribute("stroke", "lightgray")
                element.setAttribute("fill", "none")
                element.setAttribute("line-style", "dashed")
                svg_parent.appendChild(element);
            }
            svg_element += 1;
            for(let line=last_lineno; line < new_lineno; line+=1) {
                let top = (line - last_lineno) / (new_lineno - last_lineno) * (new_top - last_top) + last_top;
                line_map.push(top);
                console.log(line);
            }
            last_lineno = new_lineno;
            last_top = new_top;
        }
        console.log("line_map", line_map)
        return line_map;
    }

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