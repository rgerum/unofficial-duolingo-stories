import React from "react";
import "./question_arrange.css"

import {EditorHook} from "./editor_hooks";
import {useCallOnActivation} from "./questions_includes";

/*
The ARRANGE question
It consists of buttons that the learner needs to click in the right order.

[ARRANGE]
> Tap what you hear
Speaker560: ¡[(Necesito) (las~llaves) (de) (mi) (carro)!]
~              I~need     the~keys     of   my   car
 */

export function QuestionArrange(props) {
    let element = props.element;
    let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""

    let onClick;
    [hidden2, onClick] = EditorHook(hidden2, props.element.editor, props.editor);

    useCallOnActivation(element.trackingProperties.line_index, props.controls.block_next);

    let [buttonState, click] = useArrangeButtons(element.phraseOrder, props.controls.right, props.controls.wrong,
        (i) => {if(!props.editor) props.setUnhide(element.characterPositions[i])})

    return <div style={{textAlign: "center"}} className={"fadeGlideIn "+hidden2} onClick={onClick} lineno={element?.editor?.block_start_no}>
        <div>
            {element.selectablePhrases.map((phrase, index) => (
                <span key={index} className="word_order"
                      data-status={[undefined, "off", "wrong"][buttonState[index]]}
                      onClick={()=>click(index)}>{phrase}</span>
            ))}
        </div>
    </div>
}


function useArrangeButtons(order, callRight, callWrong, callAdvance) {
    let [buttonState, setButtonState] = React.useState([...new Array(order.length)]);
    let [position, setPosition] = React.useState(0);

    function click(index) {
        if(buttonState[index] === 1)
            return

        if(position === order[index]) {
            if(position === order.length-1)
                callRight();
            callAdvance(position);
            setButtonState(buttonState => buttonState.map((v, i) => i === index ? 1 : v))
            setPosition(position + 1)
        }
        else {
            setTimeout(()=>{setButtonState(buttonState => buttonState.map((v, i) => (i === index && v === 2) ? 0 : v))}, 820);
            setButtonState(buttonState => buttonState.map((v, i) => i === index ? 2 : v))
            callWrong();
        }
    }

    return [buttonState, click]
}
