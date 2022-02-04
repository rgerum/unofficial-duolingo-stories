import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import {javascript} from "@codemirror/lang-javascript"
import { ViewUpdate } from "@codemirror/view"
import {HighlightStyle, tags as t} from "@codemirror/highlight"
import {processStoryFile} from "./syntax_parser_new.mjs";
import React from 'react';
import ReactDOM from 'react-dom';
import {Story} from "./story_react";
import {EditorOverview} from "./editor"
import {getStory, setStory} from "./api_calls";

import {example} from "./parser"


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
            if (last_lineno !== lineno || last_avatar !== Object.keys(window.character_avatars).length) {
                if (story === undefined || last_avatar !== Object.keys(window.character_avatars).length) {
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
            violet = "#c678dd",
            darkBackground = "#21252b",
            highlightBackground = "#2c313a",
            background = "#282c34",
            tooltipBackground = "#353a42",
            selection = "#3E4451",
            cursor = "#528bff"

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
                color: coral
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
                tag: [t.atom, t.bool, t.special(t.variableName)],
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
            doc: story_data.text,
            extensions: [basicSetup, example(), sync, theme, highlightStyle]
        })

        let view = new EditorView({
            state: startState,
            parent: document.getElementById('editor')
        })


            `[DATA]
fromLanguageName=A Walk in Nature
icon=7c7bff57edb092a0043a270f9c38f3153699b0da
set_id=68
set_index=6

[HEADER]
> El  examen~de~inglés
~ the English~test    

[LINE]
> Junior está en su~casa   con  Zari.
~ Junior is   at his~house with Zari 

[LINE]
Speaker415: ¡Zari, necesito tu~ayuda! 
~            Zari  I~need   your~help 

[LINE]
Speaker418: ¿Tú  necesitas mi ayuda?
~            you need      my help  

[LINE]
Speaker415: Sí,  tengo  un examen~de~inglés~muy~importante…
~           yes  I~have a  very~important~English~test     

[MULTIPLE_CHOICE]
> Junior has a Spanish exam soon.
+ No, that's wrong.
- Yes, that's right.

[ARRANGE]
> Tap what you hear
Speaker58: [(Estoy) (cansado) (de) (la~comida~para~perros).]
~            I~am    tired     of   (the)~dog~food   


[CONTINUATION]
> What comes next?
Speaker58: Y   quiero dormir   [en tu   cama].
~          and I~want to~sleep  on your bed   
- en la~luna 
~ on the~moon
- en el~trabajo
~ at work      
+ en tu   cama
~ on your bed 

[SELECT_PHRASE]
> Select the missing phrase
Speaker58: ¿Entonces [prefieres~dormir]       afuera? 
~           then      do~you~prefer~to~sleep  outside 
- te vienes a dormir
+ prefieres dormir
- prefieres morir

[POINT_TO_PHRASE]
> Choose the option that means "tired."
Speaker560: (Perdón), mi amor, (estoy) (+cansada). ¡(Trabajo) mucho!
~            sorry    my love   I~am     tired       I~work   a~lot 



[MATCH]
> Tap the pairs
- vas <> go
- Junior <> Junior
- necesito <> I need
- Dónde <> where
- tengo que estudiar <> I have to study
`

            `


[LINE]
Speaker415: Y   yo quiero jugar…  
~           and I  want   to~play 

[LINE]
Speaker415: … pero tengo~que~estudiar.
~             but  I~have~to~study    

[MULTIPLE_CHOICE]
> Junior needs to study English, but he really wants to…
- …study history.
- …take over the world.
+ …play a video game.

[LINE]
Speaker418: ¡Vamos~a~estudiar juntos!   ¡Yo hablo muy~bien~inglés!  
~            let's~study      together   I  speak English~very~well 

[ARRANGE]
> Tap what you hear
Speaker418: ¿[Dónde está tu   libro?]
~             where is   your book   
TODO

[LINE]
Speaker415: En mi mochila. 
~           in my backpack 

[LINE]
Speaker418: Y…   ¿dónde está tu~mochila?   
~           and   where is   your~backpack 

[LINE]
Speaker415: En la~escuela.
~           at school     

[MULTIPLE_CHOICE]
> Where's Junior's backpack?
- in his room
- in Zari's living room
+ at his school

[LINE]
Speaker418: Junior, ¿cómo vamos~a~estudiar      sin     tu~libro? 
~           Junior   how  we~are~going~to~study without your~book 

[LINE]
Speaker415: Tú  vas a  la~escuela, buscas       mi libro…
~           you go  to school      you~look~for my book  

[LINE]
Speaker415: … y   yo juego aquí en mi casa. 
~             and I  play  here at my house 

[MULTIPLE_CHOICE]
> What does Junior want Zari to do?
- buy him a new backpack
- play video games with him
+ go get his English book while he plays video games

`
    }
    a()
}