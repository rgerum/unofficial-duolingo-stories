import React, {useState} from "react";
import "./question_match.css"

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

    let [orderA, setOrderA] = useState([]);
    let [orderB, setOrderB] = useState([]);
    let [clicked, setClicked] = useState(undefined);
    let [last_clicked, setLastClicked] = useState(undefined);

    let order = orderB.concat(orderA);

    // when order is not initialized or when the number of elements changed in the editor
    if(orderA === undefined || orderA.length !== props.element.fallbackHints.length) {
        let clicked = [];
        let orderA = [];
        let orderB = [];
        for(let i in props.element.fallbackHints) {
            orderA.push(parseInt(i));
            orderB.push(parseInt(i));
            clicked.push(undefined); clicked.push(undefined);
        }
        shuffle(orderA);
        shuffle(orderB);
        setOrderA(orderA);
        setOrderB(orderB);
        setClicked(clicked);
        setLastClicked(undefined);
    }

    function click(index) {
        index = parseInt(index);
        // do not allow to click on finished words again
        if(clicked[index] === "right")
            return
        // select the word
        if(last_clicked === undefined || ((index >= orderB.length) === (last_clicked >= orderB.length))) {
            clicked[index] = "selected";
            if(last_clicked !== undefined)
                clicked[last_clicked] = undefined;
            setLastClicked(index);
            setClicked(clicked);
        }
        // deselect the word
        else if(last_clicked === index) {
            setLastClicked(undefined);
            clicked[index] = undefined;
            setClicked(clicked);
        }
        // the pair is right
        else if(order[last_clicked] === order[index]) {
            clicked[index] = "right";
            clicked[last_clicked] = "right";
            setLastClicked(undefined);
            setClicked(clicked);
            let right_count = clicked.map((item, )=>(item === "right")).reduce((a,b)=>a+b, 0);
            if(right_count >= clicked.length)
                props.controls.right();
        }
        // the pair is wrong
        else if(order[last_clicked] !== order[index]) {
            let last_clicked_old = last_clicked;
            clicked[index] = "wrong";
            clicked[last_clicked_old] = "wrong";
            setLastClicked(undefined);
            setClicked(clicked);
            setTimeout(()=> {
                if(clicked[index] === "wrong")
                    clicked[index] = undefined;
                if(clicked[last_clicked_old] === "wrong")
                    clicked[last_clicked_old] = undefined;
                setClicked(clicked);
            }, 1500);
        }
    }

    // when this question appears do not allow the user to click "continue" until they answered the question
    useCallOnActivation(element.trackingProperties.line_index, props.controls.block_next);

    let onClick;
    [hidden2, onClick] = EditorHook(hidden2, props.element.editor, props.editor);

    function get_color(state) {
        if(state === "right")
            return "color_right_fade_to_disabled button_inactive_anim"
        if(state === "wrong")
            return "color_false_to_base button_click"
        if(state === "selected")
            return "color_selected button_click"
        return "color_base button_click"
    }

    return <div className={"fadeGlideIn "+hidden2} onClick={onClick} lineno={element?.editor?.block_start_no}>
        <span className="question">{element.prompt}</span>
        <div className="match_container">
            <div className="match_col">
            {orderB.map((phrase, index) => (
                    <button key={index} className={"match_word "+get_color(clicked[index])}
                        onClick={()=>click(index)}>
                        {element.fallbackHints[phrase] ? element.fallbackHints[phrase][["phrase", "translation"][1]] : ""}
                    </button>
            ))}
            </div>
            <div className="match_col">
            {orderA.map((phrase, index) => (
                <button key={index} className={"match_word "+get_color(clicked[index + orderB.length])}
                        onClick={()=>click(index + orderB.length)}>
                    {element.fallbackHints[phrase] ? element.fallbackHints[phrase][["phrase", "translation"][0]] : ""}
                </button>
            ))}
            </div>
        </div>
    </div>
}
