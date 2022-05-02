import React from "react";
import {useChoiceButtons} from "./questions_includes";
import {EditorHook} from "./editor_hooks";
import {HintLineContent} from "./line_hints";
import {useCallOnActivation} from "./questions_includes";


export function QuestionMultipleChoice(props) {
    let element = props.element;
    //let hidden = (props.progress < element.trackingProperties.line_index) ? "hidden": ""
    let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""

    useCallOnActivation(element.trackingProperties.line_index, props.controls.block_next);
    let [buttonState, click] = useChoiceButtons(element.answers.length, element.correctAnswerIndex,
        ()=> {
            if(props.editor) return;
            props.controls.unhide(props.element.trackingProperties.line_index);
            props.controls.right();
        },
        props.controls.wrong
    );

    let onClick;
    [hidden2, onClick] = EditorHook(hidden2, props.element.editor);

    return <div className={"fadeGlideIn "+hidden2} onClick={onClick} lineno={element?.editor?.block_start_no}>
        {element.question ?
            <span className="question">
                    <HintLineContent content={element.question} />
                    </span> : null
        }
        <ul className="multiple_choice_ul">
            {element.answers.map((answer, index) => (
                <li key={index} className="multiple_choice_li"
                    onClick={()=>click(index)}
                    data-right={buttonState[index] === "right" ? "true" : undefined}
                    data-off={buttonState[index] === "right" || buttonState[index] === "false-done" ? "true" : undefined}
                    data-false={buttonState[index] === "false" ? "true" : undefined}
                >
                    <button className="multiple_choice_checkbox"/>
                    <div className="multiple_choice_answer_text">
                        <HintLineContent content={answer} />
                    </div>
                </li>
            ))}
        </ul>
    </div>
}


