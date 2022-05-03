import React from "react";
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
            props.controls.unhide(props.element.trackingProperties.line_index);
            props.controls.right();
        },
        props.controls.wrong
    );

    // connect the editor functions
    let onClick;
    [hidden2, onClick] = EditorHook(hidden2, props.element.editor);

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
                <li key={index} className="multiple_choice_li"
                    onClick={()=>click(index)}
                    data-right={buttonState[index] === "right" ? "true" : undefined}
                    data-off={buttonState[index] === "right" || buttonState[index] === "false-done" ? "true" : undefined}
                    data-false={buttonState[index] === "false" ? "true" : undefined}
                >
                    {/* with a button and a text */}
                    <button className="multiple_choice_checkbox"/>
                    <div className="multiple_choice_answer_text">
                        <HintLineContent content={answer} />
                    </div>
                </li>
            ))}
        </ul>
    </div>
}
