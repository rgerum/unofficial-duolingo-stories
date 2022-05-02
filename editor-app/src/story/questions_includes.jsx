import React from "react";
import {useEventListener} from "./includes";


export function useChoiceButtons(count, rightIndex, callRight, callWrong) {
    let [buttonState, setButtonState] = React.useState([...new Array(count)]);

    function click(index) {
        if(buttonState[index] !== undefined)
            return
        if(index === rightIndex) {
            setButtonState(buttonState => buttonState.map((v, i) =>
                i === index ? "right" :
                    v === "false" ? "false-done" : "done"
            ))
            callRight();
        }
        else {
            setButtonState(buttonState => buttonState.map((v, i) => i === index ? "false" : v))
            callWrong();
        }
    }

    return [buttonState, click]
}


export function useCallOnActivation(index, handler) {
    useEventListener("progress_changed", e => {
        if(e.detail === index)
            handler();
    })
}