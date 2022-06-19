import React, {useState} from "react";
import {shuffle} from "./includes";
import {EditorHook} from "./editor_hooks";
import {useCallOnActivation} from "./questions_includes";

/*
The MATCH question.
It consists of two columns of buttons. The learner needs to find the right pars.

[MATCH]
> Tap the pairs
- estás <> you are
- mucho <> a lot
- es <> is
- las llaves <> the keys
- la <> the
 */

export function QuestionMatch(props) {
    let element = props.element;
    // whether this part is already shown
    let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""

    let [order, setOrder] = useState([]);
    let [clicked, setClicked] = useState(undefined);
    let [last_clicked, setLastClicked] = useState(undefined);

    // when order is not initialized or when the number of elements changed in the editor
    if(order === undefined || order.length/2 !== props.element.fallbackHints.length) {
        let clicked = [];
        let order2 = [];
        for(let i in props.element.fallbackHints) {
            order2.push([i, 0]);
            order2.push([i, 1]);
            clicked.push(undefined); clicked.push(undefined);
        }
        shuffle(order2);
        setOrder(order2);
        setClicked(clicked);
        setLastClicked(undefined);
    }

    function click(index) {
        // do not allow to click on finished words again
        if(clicked[index] === "right")
            return
        // select the word
        if(last_clicked === undefined) {
            setLastClicked(index);
            clicked[index] = "selected";
            setClicked(clicked);
        }
        // deselect the word
        else if(last_clicked === index) {
            setLastClicked(undefined);
            clicked[index] = undefined;
            setClicked(clicked);
        }
        // the pair is right
        else if(order[last_clicked][0] === order[index][0]) {
            setLastClicked(undefined);
            clicked[index] = "right";
            clicked[last_clicked] = "right";
            setClicked(clicked);
            let right_count = clicked.map((item, )=>(item === "right")).reduce((a,b)=>a+b, 0);
            if(right_count >= clicked.length)
                props.controls.right();
        }
        // the pair is wrong
        else if(order[last_clicked][0] !== order[index][0]) {
            setLastClicked(undefined);
            clicked[index] = "wrong";
            clicked[last_clicked] = "wrong";
            setClicked(clicked);
            setTimeout(()=> {
                if(clicked[index] === "wrong")
                    clicked[index] = undefined;
                if(clicked[last_clicked] === "wrong")
                    clicked[last_clicked] = undefined;
                setClicked(clicked);
            }, 1500);
        }
    }

    // when this question appears do not allow the user to click "continue" until they answered the question
    useCallOnActivation(element.trackingProperties.line_index, props.controls.block_next);

    let onClick;
    [hidden2, onClick] = EditorHook(hidden2, props.element.editor, props.editor);

    return <div className={"fadeGlideIn "+hidden2} onClick={onClick} lineno={element?.editor?.block_start_no}>
        <span className="question">{element.prompt}</span>
        <div style={{textAlign: "center"}}>
            {order.map((phrase, index) => (
                    <button key={index} className="word_match"
                        data-status={clicked[index]}
                        onClick={()=>click(index)}>
                        {element.fallbackHints[phrase[0]] ? element.fallbackHints[phrase[0]][["phrase", "translation"][phrase[1]]] : ""}
                    </button>
            ))}
        </div>
    </div>
}
