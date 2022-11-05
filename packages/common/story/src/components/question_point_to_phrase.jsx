import React from "react";
import "./question_point_to_phrase.css"

import {EditorHook} from "./editor_hooks";
import {useChoiceButtons} from "./questions_includes";
import {HintLineContent} from "./line_hints";


/*
The POINT_TO_PHRASE question
The sentence is first presented to the learner like a normal line, then the learner is asked which word
of the line has a meaning asked for by the question. The right answer is marked with the + sign.

[POINT_TO_PHRASE]
> Choose the option that means "tired."
Speaker560: (Perdón), mi amor, (estoy) (+cansada). ¡(Trabajo) mucho!
~            sorry    my love   I~am     tired       I~work   a~lot

 */

export function QuestionPointToPhrase(props) {
    let element = props.element;
    let hidden = "";
    if(props.hidden)
        hidden = "hidden";

    // connect the editor functions
    let onClick;
    [hidden, onClick] = EditorHook(hidden, props.element.editor, props.editor);

    // find which parts of the text should be converted to buttons
    let button_indices = {};
    for(let [index, part] of Object.entries(element.transcriptParts))
        if(part.selectable) button_indices[index] = Object.keys(button_indices).length;

    // get button states and a click function
    let [buttonState, click] = useChoiceButtons(element.transcriptParts.length, element.correctAnswerIndex,
        ()=> {
            if(!props.editor) {
                //props.setUnhide(props.element.trackingProperties.line_index);
                props.controls.right();
            }
        },
        props.controls.wrong
    );

    function get_color(state) {
        if(state === "right")
            return "color_right button_disabled_up"
        if(state === "false")
            return "color_false button_inactive_anim"
        if(state === "done")
            return "color_disabled button_inactive"
        return "color_base button_click"
    }

    return <div className={hidden} onClick={onClick} lineno={element?.editor?.block_start_no}>
        {/* display the question */}
        <div className="question">
            <HintLineContent content={element.question} />
        </div>
        {/* display the text */}
        <div>
            {element.transcriptParts.map((part, index) => (
                /* is the text selectable? */
                part.selectable ?
                    /* then display a button */
                    <div className={"word_button "+get_color(buttonState[button_indices[index]])}
                         key={index}
                         onClick={()=>click(button_indices[index])}>
                        {part.text}
                    </div>
                    /* if it is not selectable just display the text */
                    : <span key={index}>{part.text}</span>
            ))}
        </div>
    </div>
}