import React, {useEffect} from "react";
import styles from "./question_multiple_choice.module.css"
import styles_common from "../common.module.css"

import useChoiceButtons from "./questions_useChoiceButtons";
import {EditorHook} from "../editor_hooks";
import HintLineContent from "../text_lines/line_hints";
import {EditorContext, StoryContext} from "../story";
import QuestionPrompt from "./question_prompt";


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
SELECT_PHRASE question, but here the learner does not hear the hidden part of the sentence.
 */


export default function QuestionMultipleChoice({setUnhide, progress, element}) {
    const controls = React.useContext(StoryContext);
    const editor = React.useContext(EditorContext);

    const [done, setDone] = React.useState(false);
    const active = progress === element.trackingProperties.line_index;

    useEffect(() => {
        if(active && !done) {
            controls.block_next();
        }
    }, [active, done]);

    // whether this part is already shown
    let hidden2 = (!active) ? styles_common.hidden : ""

    // get button states and a click function
    let [buttonState, click] = useChoiceButtons(element.answers.length, element.correctAnswerIndex,
        ()=> {
            if(editor) return;
            setUnhide(-1);
            setDone(true);
            controls.right();
        },
        controls.wrong
    );

    // connect the editor functions
    let onClick;
    [hidden2, onClick] = EditorHook(hidden2, element.editor, editor);

    function get_color(state) {
        if(state === "right")
            return styles.right
        if(state === "false")
            return styles.false
        if(state === "done")
            return styles.done
        return styles.default
    }
    function get_color_text(state) {
        if(state === "right")
            return styles_common.color_base
        if(state === "false")
            return styles_common.color_disabled
        if(state === "done")
            return styles_common.color_disabled
        return styles_common.color_base
    }

    return <div className={styles_common.fadeGlideIn+" "+hidden2} onClick={onClick} data-lineno={element?.editor?.block_start_no}>
        {/* Display the question if a question is there */}
        {element.question ? <QuestionPrompt question={element.question} /> : null}
        {/* Display the answers */}
        <ul className={styles.multiple_choice_ul}>
            {element.answers.map((answer, index) => (
                /* on answer field */
                <li key={index} className={styles.multiple_choice_li}
                    onClick={()=>click(index)}
                >
                    {/* with a button and a text */}
                    <button className={styles.multiple_choice_checkbox+" "+get_color(buttonState[index])}/>
                    <div className={styles.multiple_choice_answer_text+" "+get_color_text(buttonState[index])}>
                        <HintLineContent content={answer} />
                    </div>
                </li>
            ))}
        </ul>
    </div>
}
