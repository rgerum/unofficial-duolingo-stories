import React, {useEffect} from "react";
import styles from "./question_point_to_phrase.module.css"
import styles_common from "../common.module.css"

import {EditorHook} from "../editor_hooks";
import useChoiceButtons from "./questions_useChoiceButtons";
import HintLineContent from "../text_lines/line_hints";
import {EditorContext, StoryContext} from "../story";
import QuestionPrompt from "./question_prompt";


/*
The POINT_TO_PHRASE question
The sentence is first presented to the learner like a normal line, then the learner is asked which word
of the line has a meaning asked for by the question. The right answer is marked with the + sign.

[POINT_TO_PHRASE]
> Choose the option that means "tired."
Speaker560: (Perdón), mi amor, (estoy) (+cansada). ¡(Trabajo) mucho!
~            sorry    my love   I~am     tired       I~work   a~lot

 */

export default function QuestionPointToPhrase({progress, element}) {
    const controls = React.useContext(StoryContext);
    const editor = React.useContext(EditorContext);

    const [done, setDone] = React.useState(false);
    const active1 = progress === element.trackingProperties.line_index;
    const active2 = (progress-0.5) === element.trackingProperties.line_index;

    let hidden = !active2 ? styles_common.hidden : "";

    useEffect(() => {
        if(active1) {
            controls.setProgressStep(0.5);
        }
        if(active2) {
            controls.setProgressStep(0.5);
            if(!done)
                controls.block_next();
        }
    }, [active1, active2, done]);

    // connect the editor functions
    let onClick;
    [hidden, onClick] = EditorHook(hidden, element.editor, editor);

    // find which parts of the text should be converted to buttons
    let button_indices = {};
    for(let [index, part] of Object.entries(element.transcriptParts))
        if(part.selectable) button_indices[index] = Object.keys(button_indices).length;

    // get button states and a click function
    let [buttonState, click] = useChoiceButtons(element.transcriptParts.length, element.correctAnswerIndex,
        ()=> {
            if(!editor) {
                //props.setUnhide(props.element.trackingProperties.line_index);
                controls.right();
                setDone(true);
            }
        },
        controls.wrong
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

    return <div className={hidden} onClick={onClick} data-lineno={element?.editor?.block_start_no}>
        {/* display the question */}
        <QuestionPrompt question={element.question} />
        {/* display the text */}
        <div>
            {element.transcriptParts.map((part, index) => (
                /* is the text selectable? */
                part.selectable ?
                    /* then display a button */
                    <div className={styles.word_button+" "+get_color(buttonState[button_indices[index]])}
                         key={index}
                         onClick={()=>click(button_indices[index])}>
                        {part.text}
                    </div>
                    /* if it is not selectable just display the text */
                    : <span key={index}>{part.text}</span>
            ))}
        </div>
    </div>
}