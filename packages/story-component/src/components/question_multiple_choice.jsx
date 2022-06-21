import React from "react";
import "./question_multiple_choice.css"

import {useChoiceButtons} from "./questions_includes";
import {EditorHook} from "./editor_hooks";
import {HintLineContent} from "./line_hints";
import {useCallOnActivation} from "./questions_includes";


/*
The MULTIPLE_CHOICE question.
The learner has to find the right answer from different answers which have a checkbox.

[MULTIPLE_CHOICE]
> Priti was so tired that…
- …she fell asleep in the kitchen.
+ …she put salt in her coffee.
- …she put her keys in her coffee.

The CONTINUATION question
It also uses the multiple choice component. The learner has to find out how to continue the sentence. Similar to the
SELECT_PHRASE question, but here the learner does not her the hidden part of the sentence.
 */


export function QuestionMultipleChoice(props) {
    let element = props.element;
    // whether this part is already shown
    let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""

    // when this question appears do not allow the user to click "continue" until they answered the question
    useCallOnActivation(element.trackingProperties.line_index, props.controls.block_next);

    // get button states and a click function
    let [buttonState, click] = useChoiceButtons(element.answers.length, element.correctAnswerIndex,
        ()=> {
            if(props.editor) return;
            props.setUnhide(-1);
            props.controls.right();
        },
        props.controls.wrong
    );

    // connect the editor functions
    let onClick;
    [hidden2, onClick] = EditorHook(hidden2, props.element.editor, props.editor);

    function get_color(state) {
        if(state === "right")
            return "color_right button_disabled_up"
        if(state === "false")
            return "color_false button_inactive_anim"
        if(state === "done")
            return "color_disabled button_inactive"
        return "color_base button_click"
    }
    function get_color_text(state) {
        if(state === "right")
            return "color_base"
        if(state === "false")
            return "color_disabled"
        if(state === "done")
            return "color_disabled"
        return "color_base"
    }
    /*
                        data-right={buttonState[index] === "right" ? "true" : undefined}
                    data-off={buttonState[index] === "right" || buttonState[index] === "false-done" ? "true" : undefined}
                    data-false={buttonState[index] === "false" ? "true" : undefined}
     */

    return <div className={"fadeGlideIn "+hidden2} onClick={onClick} lineno={element?.editor?.block_start_no}>
        {/* Display the question if a question is there */}
        {element.question ?
            <span className="question">
                <HintLineContent content={element.question} />
            </span> : null
        }
        {/* Display the answers */}
        <ul className="multiple_choice_ul">
            {element.answers.map((answer, index) => (
                /* on answer field */
                <li key={index} className={"multiple_choice_li "}
                    onClick={()=>click(index)}
                >
                    {/* with a button and a text */}
                    <button className={"multiple_choice_checkbox "+get_color(buttonState[index])}/>
                    <div className={"multiple_choice_answer_text "+get_color_text(buttonState[index])}>
                        <HintLineContent content={answer} />
                    </div>
                </li>
            ))}
        </ul>
    </div>
}
