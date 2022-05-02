import React from "react";
import {EditorHook} from "./editor_hooks";
import {useChoiceButtons} from "./questions_includes";
import {HintLineContent} from "./line_hints";


export function QuestionPointToPhrase(props) {
    let element = props.element;
    let hidden = "";
    if(props.hidden)
        hidden = "hidden";

    let onClick;
    [hidden, onClick] = EditorHook(hidden, props.element.editor);

    let button_indices = {};
    for(let [index, part] of Object.entries(element.transcriptParts))
        if(part.selectable) button_indices[index] = Object.keys(button_indices).length;

    let [buttonState, click] = useChoiceButtons(element.transcriptParts.length, element.correctAnswerIndex,
        ()=> {
            if(!props.editor) {
                props.controls.unhide(props.element.trackingProperties.line_index);
                props.controls.right();
            }
        },
        props.controls.wrong
    );

    return <div className={hidden} onClick={onClick} lineno={element?.editor?.block_start_no}>
        <div className="question">
            <HintLineContent content={element.question} />
        </div>
        <div>
            {element.transcriptParts.map((part, index) => (
                part.selectable ?
                    <div className="word_button"
                         key={index}
                         onClick={()=>click(button_indices[index])}
                         data-status={(buttonState[button_indices[index]] === "right") ? "right" :
                             (buttonState[button_indices[index]] === "false-done" || buttonState[button_indices[index]] === "done") ? "off" :
                                 (buttonState[button_indices[index]] === "false") ? "wrong" : undefined}
                    >{part.text}</div> :
                    <span key={index}>{part.text}</span>
            ))}
        </div>
    </div>
}