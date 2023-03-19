import React, {useEffect} from "react";
import styles from "./question_select_phrase.module.css"
import styles_common from "../common.module.css"

import {EditorHook} from "../editor_hooks";
import useChoiceButtons from "./questions_useChoiceButtons";
import {EditorContext, StoryContext} from "../story";

/*
The SELECT_PHRASE question.
The learner has to listen what is spoken and find the right answer. The answers are buttons and do not contain
translations as the focus (in contrast to CONTINUATION) is on listening and not on content.

[SELECT_PHRASE]
> Select the missing phrase
Speaker507: Hoy   tengo  [un~partido~importante].
~           today I~have  an~important~game
+ un partido importante
- un batido importante
- una parte imponente
 */

export default function QuestionSelectPhrase({setUnhide, progress, element}) {
    const controls = React.useContext(StoryContext);
    const editor = React.useContext(EditorContext);

    const [done, setDone] = React.useState(false);
    const active = progress === element.trackingProperties.line_index;

    let hidden2 = (!active) ? styles_common.hidden : ""

    useEffect(() => {
        if(active && !done && controls?.block_next) {
            controls.block_next();
        }
    }, [active, done])

    // connect the editor functions
    let onClick;
    [hidden2, onClick] = EditorHook(hidden2, element.editor, editor);

    // get button states and a click function
    let [buttonState, click] = useChoiceButtons(element.answers.length, element.correctAnswerIndex,
        ()=> {
            if(!editor) {
                if(setUnhide)
                    setUnhide(-1);
                setDone(true);
                if(controls?.right)
                    controls?.right();
            }
        },
        controls?.wrong || (() => {})
    );


    function get_color(state) {
        if(state === "right")
            return styles.right
        if(state === "false")
            return styles.false
        if(state === "done")
            return styles.done
        return styles.default
    }

    return <div className={styles_common.fadeGlideIn+" "+hidden2} onClick={onClick} data-lineno={element?.editor?.block_start_no}>
        <div>
            {/* display the buttons */}
            {element.answers.map((answer, index) => (
                /* one answer button */
                <button key={index} className={styles.answer_button+" "+get_color(buttonState[index])}
                        onClick={() => click(index)}>
                    {answer.text ? answer.text : answer}
                </button>
            ))}
        </div>
    </div>
}