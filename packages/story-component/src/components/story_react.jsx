import React, {useEffect, useState} from 'react';
import './story.css';

import {playSoundRight, playSoundWrong} from "./sound_effects";
import {Part} from "./part";
import {FinishedPage} from "./finish_page";
import {setStoryDone, scroll_down} from "./includes";
import {Legal} from "./legal";
import {Link, useNavigate} from "react-router-dom";


export function Story(props) {
    let story = props.story;
    let editor = props.editor;

    let [progress, setProgress] = useState(0);
    let [spacer, setSpacer] = useState(0);
    let [right, setRight] = useState(0);
    let [blocked, setBlocked] = useState(0);

    function wrong() {
        playSoundWrong();
    }

    function right_call() {
        playSoundRight();
        setRight(true);
        setBlocked(false);
    }

    function block_next() {
        setBlocked(true);
    }

    function next() {
        if(!blocked)
            dispatchEvent(new CustomEvent('next_button_clicked', {detail: progress}));
    }

    function advance_progress() {
        dispatchEvent(new CustomEvent('progress_changed', {detail: progress + 1}));
        setProgress(progress += 1);
        setRight(false);
    }

    let navigate = useNavigate();
    function finish() {
        setStoryDone(story.id);
        navigate("/");
    }

    useEffect(() => {
        if(!document.getElementById("story")) return
        let parts = document.getElementById("story").querySelectorAll("div.part:not(.hidden)")
        let last = parts[parts.length-1];
        let spacerX = window.innerHeight/2-last.clientHeight*0.5;

        if(!editor)
            scroll_down();
        if(spacerX !== spacer)
            setSpacer(spacerX);
    });

    let controls = {
        wrong: wrong,
        right: right_call,
        block_next: block_next,
        next: next,
        advance_progress: advance_progress,
    }

    var parts = [];
    let last_id = -1;
    for(let element of story.elements) {
        if(element.trackingProperties === undefined) {
            continue;
        }
        if(last_id !== element.trackingProperties.line_index) {
            parts.push([]);
            last_id = element.trackingProperties.line_index;
        }
        parts[parts.length-1].push(element);
    }

    let finished = (progress === parts.length);

    if(editor) {
        return (
            <div id="story">
                {parts.map((part, i) => (
                    <Part key={i} editor={editor} controls={controls} progress={progress}
                          part={part}/>
                ))}
            </div>
        );
    }

    return (
        <div>
            <div id="header">
                <div id="header_icon"><Link id="quit" to="/" /></div>
                <div id="progress">
                    <div id="progress_inside" style={{width: progress/parts.length*100+"%"}}>
                        <div id="progress_highlight"></div>
                    </div>
                </div>
            </div>
            <div id="main">
                <div id="story">
                    <Legal />
                    {parts.map((part, i) => (
                        <Part key={i} editor={editor} controls={controls} progress={progress} part={part} />
                    ))}
                </div>
                <div style={{height: spacer+"px"}} />
                {finished ? <FinishedPage story={story} /> : null
                }
            </div>
            <div id="footer"
                 data-right={right ? "true" : undefined}
            >
                <div id="footer_content">
                    <div id="footer_result">
                        <div>
                            <div id="footer_result_icon"><span/></div>
                            <div id="footer_result_text"><h2>You are correct</h2></div>
                        </div>
                    </div>
                    <div id="footer_buttons">
                        {finished ?
                            <button id="button_next"
                                    className="button" onClick={() => finish()}>finished</button>
                            : <button id="button_next"
                                      data-status={blocked ? "inactive" : undefined}
                                      className="button" onClick={() => next()}>continue</button>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
