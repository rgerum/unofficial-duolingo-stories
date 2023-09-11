import React, {useEffect} from "react";
import styles from "./question_arrange.module.css"
import styles_common from "../common.module.css"

import {EditorHook} from "../editor_hooks";
import {EditorContext, StoryContext} from "../story";

/*
The ARRANGE question
It consists of buttons that the learner needs to click in the right order.

[ARRANGE]
> Tap what you hear
Speaker560: ¡[(Necesito) (las~llaves) (de) (mi) (carro)!]
~              I~need     the~keys     of   my   car
 */

export default function QuestionArrange({setUnhide, progress, element}) {
    const controls = React.useContext(StoryContext);
    const editor = React.useContext(EditorContext);

    const [done, setDone] = React.useState(false);
    const active = progress === element.trackingProperties.line_index;

    useEffect(() => {
        if(active && !done) {
            controls.block_next();
        }
    }, [active, done]);

    let hidden2 = (!active) ? styles_common.hidden : ""

    let onClick;
    [hidden2, onClick] = EditorHook(hidden2, element.editor, editor);

    let [buttonState, click] = useArrangeButtons(element.phraseOrder, controls.right, controls.wrong,
        (i) => {setDone(true); if(!editor) setUnhide(element.characterPositions[i])}, active)

    return <div style={{textAlign: "center"}} className={styles_common.fadeGlideIn+" "+hidden2+" "+element.lang} onClick={onClick} data-lineno={element?.editor?.block_start_no}>
        <div>
            {element.selectablePhrases.map((phrase, index) => (
                <span key={index} className={styles.word_order}
                      data-cy="arrange-button"
                      data-status={[undefined, "off", "wrong"][buttonState[index]]}
                      onClick={()=>click(index)}>{phrase}</span>
            ))}
        </div>
    </div>
}


function useArrangeButtons(order, callRight, callWrong, callAdvance, active) {
    let [buttonState, setButtonState] = React.useState([...new Array(order.length)]);
    let [position, setPosition] = React.useState(0);

    let click = React.useCallback((index) => {
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
    }, [buttonState, position, order, callRight, callWrong]);

    let key_event_handler = React.useCallback((e) => {
        let value = parseInt(e.key)-1;
        if(value < order.length)
            click(value);
    }, [click]);
    React.useEffect(() => {
        if(active) {
            window.addEventListener('keypress', key_event_handler);
            return () => window.removeEventListener('keypress', key_event_handler);
        }
    }, [key_event_handler, active]);

    return [buttonState, click]
}
