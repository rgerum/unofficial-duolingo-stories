import React from "react";
import "./part.css"

import {Header, TextLine} from "./header";
import {QuestionPointToPhrase} from "./question_point_to_phrase";
import {useEventListener} from "./includes";
import {EditorHook} from "./editor_hooks";
import {HintLineContent} from "./line_hints";
import {QuestionMultipleChoice} from "./question_multiple_choice";
import {QuestionSelectPhrase} from "./question_select_phrase";
import {QuestionArrange} from "./question_arrange";
import {QuestionMatch} from "./question_match";


export function Part(props) {
    let challenge_type = props.part[props.part.length-1].trackingProperties.challenge_type;

    let [progress, setProgress] = React.useState(0);
    let [unhide, setUnhide] = React.useState(0);

    let next = () => {props.controls.advance_progress();}
    if(challenge_type === "point-to-phrase") {
        next = () => {
            if (progress === 0) {
                props.controls.block_next();
                setProgress(1);
            } else {
                props.controls.advance_progress();
                setProgress(2);
            }
        }
    }
    let line_index = props.part[0].trackingProperties.line_index;
    if(props.part[0].type === "HEADER")
        line_index = 0;
    useCallOnNextClicked(line_index, next);

    if(challenge_type === "point-to-phrase") {
        return <div>
            <TextLine editor={props.editor} progress={props.progress} element={props.part[0]} hidden={(!(progress === 0 || progress === 2)) && !props.editor} audios={props.audios}/>
            <QuestionPointToPhrase editor={props.editor} controls={props.controls} progress={props.progress} element={props.part[1]} hidden={!(progress === 1)} />
        </div>
    }
    let hidden = (props.progress < props.part[0].trackingProperties.line_index) ? "hidden": ""
    if(props.editor) hidden = "";
    return <div className={"part "+hidden} data-challengetype={challenge_type}>
        {props.part.map((element, i) => (
            <StoryLine key={i} editor={props.editor} unhide={unhide} setUnhide={setUnhide} controls={props.controls} progress={props.progress} element={element} audios={props.audios} />
        ))}
    </div>
}


function useCallOnNextClicked(index, handler) {
    useEventListener("next_button_clicked", e => {
        if(e.detail === index)
            handler();
    })
}

function ChallengePrompt(props) {
    let element = props.element;
    let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""

    let onClick;
    [hidden2, onClick] = EditorHook(hidden2, props.element.editor, props.editor);

    return <div className={"fadeGlideIn "+hidden2} onClick={onClick} lineno={element?.editor?.block_start_no}>
        <span className="question">
            <HintLineContent content={element.prompt} />
        </span>
    </div>
}

function StoryLine(props) {
    if(props.element.type === "MULTIPLE_CHOICE") {
        return <QuestionMultipleChoice editor={props.editor} controls={props.controls} setUnhide={props.setUnhide} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "SELECT_PHRASE") {
        return <QuestionSelectPhrase editor={props.editor} controls={props.controls} setUnhide={props.setUnhide} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "CHALLENGE_PROMPT") {
        return <ChallengePrompt editor={props.editor} controls={props.controls} setUnhide={props.setUnhide} progress={props.progress} element={props.element}/>
    }
    if(props.element.type === "ARRANGE") {
        return <QuestionArrange editor={props.editor} controls={props.controls} setUnhide={props.setUnhide} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "POINT_TO_PHRASE") {
        return <QuestionPointToPhrase editor={props.editor} controls={props.controls} setUnhide={props.setUnhide} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "MATCH") {
        return <QuestionMatch editor={props.editor} controls={props.controls} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "LINE") {
        return <TextLine editor={props.editor} progress={props.progress} unhide={props.unhide} element={props.element} audios={props.audios} />
    }
    if(props.element.type === "HEADER") {
        return <Header editor={props.editor} progress={props.progress} element={props.element} audios={props.audios} />
    }
    if(props.element.type === "ERROR") {
        return <div className={["error"]}>{props.element.text}</div>
    }
    return null;
}