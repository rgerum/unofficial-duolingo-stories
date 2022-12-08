import React from "react";
import styles from "./part.module.css"
import styles_common from "./common.module.css"

import {EditorHook} from "./editor_hooks";

import Header from "./text_lines/header";
import HintLineContent from "./text_lines/line_hints";
import TextLine from "./text_lines/text_line";

import QuestionArrange from "./questions/question_arrange";
import QuestionMatch from "./questions/question_match";
import QuestionMultipleChoice from "./questions/question_multiple_choice";
import QuestionPointToPhrase from "./questions/question_point_to_phrase";
import QuestionSelectPhrase from "./questions/question_select_phrase";
import {EditorContext} from "./story";


export default function Part(props) {
    let challenge_type = props.part[props.part.length-1].trackingProperties.challenge_type;
    let [unhide, setUnhide] = React.useState(0);
    let is_hidden = props.progress < props.part[0].trackingProperties.line_index;

    let hidden = (is_hidden) ? styles_common.hidden: ""
    if(props.editor) hidden = "";
    return <div className={"part"+" "+hidden} data-hidden={is_hidden} data-challengetype={challenge_type}>
        {props.part.map((element, i) => (
            <StoryLine key={i} unhide={unhide} setUnhide={setUnhide} progress={props.progress} element={element} />
        ))}
    </div>
}


function ChallengePrompt({progress, element}) {
    const editor = React.useContext(EditorContext);
    let hidden2 = (progress !== element.trackingProperties.line_index) ? styles_common.hidden : ""

    let onClick;
    [hidden2, onClick] = EditorHook(hidden2, element.editor, editor);

    return <div className={styles_common.fadeGlideIn+" "+hidden2} onClick={onClick} data-lineno={element?.editor?.block_start_no}>
        <span className={styles_common.question}>
            <HintLineContent content={element.prompt} />
        </span>
    </div>
}

function StoryLine(props) {
    if(props.element.type === "MULTIPLE_CHOICE") {
        return <QuestionMultipleChoice setUnhide={props.setUnhide} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "POINT_TO_PHRASE") {
        return <QuestionPointToPhrase progress={props.progress} element={props.element} />
    }
    if(props.element.type === "SELECT_PHRASE") {
        return <QuestionSelectPhrase setUnhide={props.setUnhide} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "CHALLENGE_PROMPT") {
        return <ChallengePrompt progress={props.progress} element={props.element}/>
    }
    if(props.element.type === "ARRANGE") {
        return <QuestionArrange setUnhide={props.setUnhide} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "POINT_TO_PHRASE") {
        return <QuestionPointToPhrase progress={props.progress} element={props.element} />
    }
    if(props.element.type === "MATCH") {
        return <QuestionMatch progress={props.progress} element={props.element} />
    }
    if(props.element.type === "LINE") {
        return <TextLine progress={props.progress} unhide={props.unhide} element={props.element} />
    }
    if(props.element.type === "HEADER") {
        return <Header progress={props.progress} element={props.element} />
    }
    if(props.element.type === "ERROR") {
        return <div className={styles.error}>{props.element.text}</div>
    }
    return null;
}