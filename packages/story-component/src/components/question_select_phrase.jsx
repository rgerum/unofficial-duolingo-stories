import React from "react";
import "./question_select_phrase.css"

import {EditorHook} from "./editor_hooks";
import {useChoiceButtons} from "./questions_includes";
import {useCallOnActivation} from "./questions_includes";

/*
The SELECT_PHRASE question.
The learner has to listen what is spoken and find the right answer. The answers are buttons and do not contain
translations as the focus (in contrast to CONTINUATION) is on listening and not on content.

[SELECT_PHRASE]
> Select the missing phrase
Speaker507: Hoy   tengo  [un~partido~importante].
~           today I~have  an~important~game
+ un partido importante
- un batido importante
- una parte imponente
 */

export function QuestionSelectPhrase(props) {
    let element = props.element;
    let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""

    // connect the editor functions
    let onClick;
    [hidden2, onClick] = EditorHook(hidden2, props.element.editor, props.editor);

    // use the choice buttons (a checkmark field with a text line next to it)
    useCallOnActivation(element.trackingProperties.line_index, props.controls.block_next);

    // get button states and a click function
    let [buttonState, click] = useChoiceButtons(element.answers.length, element.correctAnswerIndex,
        ()=> {
            if(!props.editor) {
                props.setUnhide(-1);
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

    return <div className={"fadeGlideIn "+hidden2} onClick={onClick} lineno={element?.editor?.block_start_no}>
        <div>
            {/* display the buttons */}
            {element.answers.map((answer, index) => (
                /* one answer button */
                <button key={index} className={"answer_button "+get_color(buttonState[index])}
                        onClick={() => click(index)}>
                    {answer.text ? answer.text : answer}
                </button>
            ))}
        </div>
    </div>
}