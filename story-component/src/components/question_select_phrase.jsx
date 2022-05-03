import React from "react";
import {EditorHook} from "./editor_hooks";
import {useChoiceButtons} from "./questions_includes";
import {useCallOnActivation} from "./questions_includes";


export function QuestionSelectPhrase(props) {
    let element = props.element;
    //let hidden = (props.progress < element.trackingProperties.line_index) ? "hidden": ""
    let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""

    let onClick;
    [hidden2, onClick] = EditorHook(hidden2, props.element.editor);

    useCallOnActivation(element.trackingProperties.line_index, props.controls.block_next);
    let [buttonState, click] = useChoiceButtons(element.answers.length, element.correctAnswerIndex,
        ()=> {
            if(!props.editor) {
                props.controls.unhide(props.element.trackingProperties.line_index);
                props.controls.right();
            }
        },
        props.controls.wrong
    );

    return <div className={"fadeGlideIn "+hidden2} onClick={onClick} lineno={element?.editor?.block_start_no}>
        <div>
            {element.answers.map((answer, index) => (
                <button key={index} className="answer_button"
                        onClick={() => click(index)}
                        data-status={(buttonState[index] === "right") ? "right" :
                            (buttonState[index] === "false-done" || buttonState[index] === "done") ? "off" :
                                (buttonState[index] === "false") ? "inactive" : undefined
                        }
                >
                    {answer.text ? answer.text : answer}
                </button>
            ))}
        </div>
    </div>
}