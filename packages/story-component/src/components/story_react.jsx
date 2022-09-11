import React, {useEffect, useState} from 'react';
import './story.css';

import {playSoundRight, playSoundWrong} from "./sound_effects";
import {Part} from "./part";
import {FinishedPage} from "./finish_page";
import {setStoryDone, scroll_down} from "./includes";
import {Legal} from "./legal";
import {useNavigate} from "react-router-dom";
import {Footer} from "./story_footer";
import {StoryHeader} from "./story_header";
import {Spinner} from "../react/spinner";


export function Story(props) {
    let story = props.story;
    let id = props.id;
    let editor = props.editor;
    let course = story.learningLanguage + "-" + story.fromLanguage;

    let [progress, setProgress] = useState(-1);
    let [spacer, setSpacer] = useState(0);
    let [right, setRight] = useState(0);
    let [blocked, setBlocked] = useState(0);

    let [audio_loaded, setAudioLoaded] = useState(0);

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
        setStoryDone(id);
        navigate("/"+course);
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

    React.useEffect(() => {
        if(progress === -1 && audio_loaded)
            advance_progress();
    }, [audio_loaded]);

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

    let audios = undefined;
    if(!editor) {
        let audio_urls = [];
        for(let element of story.elements) {
            if (element.type === "HEADER" || element.type === "LINE")
                if(element.audio)
                    audio_urls.push(element.audio.url);
        }

        var audio_base_path = "https://carex.uber.space/stories/";
        audios = React.useMemo(() => {
            let count = 0;
            let audios = {};
            for (let url of audio_urls) {
                if (audios[url] === undefined && url !== undefined) {
                    count += 1;
                    let a = new Audio();
                    function loadingFinished(e) {
                        a.removeEventListener('canplaythrough', loadingFinished);
                        a.removeEventListener('error', loadingFinished);
                        count -= 1;
                        if (count === 0)
                            setAudioLoaded(1);
                    }
                    a.addEventListener('canplaythrough', loadingFinished, false);
                    a.addEventListener('error', loadingFinished);
                    audios[url] = a;
                    a.src = audio_base_path + url;
                    a.load();
                }
            }
            if (count === 0)
                setAudioLoaded(1);
            return audios;
        }, [story.id])
    }

    if(!audio_loaded)
        return <Spinner />

    return (
        <div>
            <StoryHeader progress={progress} length={parts.length} course={course} />
            <div id="main">
                <div id="story">
                    <Legal />
                    {parts.map((part, i) => (
                        <Part key={i} editor={editor} controls={controls} progress={progress} part={part} audios={audios} />
                    ))}
                </div>
                <div style={{height: spacer+"px"}} />
                {finished ? <FinishedPage story={story} /> : null
                }
            </div>
            <Footer right={right} finished={finished} blocked={blocked} next={next} finish={finish} />
        </div>
    );
}
