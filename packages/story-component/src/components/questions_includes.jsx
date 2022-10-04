import React from "react";
import {useEventListener} from "./includes";


export function useChoiceButtons(count, rightIndex, callRight, callWrong) {
    // create a list with one state for each button
    let [buttonState, setButtonState] = React.useState([...new Array(count)]);

    function click(index) {
        // when the button was already clicked, do nothing
        if(buttonState[index] !== undefined)
            return
        // if the button was the right one
        if(index === rightIndex) {
            // update all button states
            setButtonState(buttonState => buttonState.map((v, i) =>
                i === index ? "right" :
                v === "false" ? "false" :
                    "done"
            ))
            // callback for clicking the right button
            callRight();
        }
        else {
            // set the state of the current button to display that the answer was wrong
            setButtonState(buttonState => buttonState.map((v, i) => i === index ? "false" : v))
            // callback for clicking the wrong button
            callWrong();
        }
    }

    // return button states and click callback
    return [buttonState, click]
}


export function useCallOnActivation(index, handler) {
    // a callback that gets called when the learner reaches this question
    useEventListener("progress_changed", e => {
        if(e.detail === index)
            handler();
    })
}