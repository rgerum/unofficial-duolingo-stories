import React, {useEffect, useState} from 'react';
import styles from './story.module.css';

import {scroll_down} from "./includes";

import Part from "./part";
import FinishedPage from "./layout/finish_page";
import Footer from "./layout/story_footer";
import StoryHeader from "./layout/story_header";
import Legal from "../legal";


export default function Story({story, navigate, id, editor, storyFinishedIndexUpdate}) {
    const storyElement = React.useRef();

    let course = story.learningLanguage + "-" + story.fromLanguage;

    let [progress, setProgress] = useState(-1);
    let [spacer, setSpacer] = useState(0);
    let [right, setRight] = useState(false);
    let [blocked, setBlocked] = useState(false);
    let [progressStep, setProgressStep] = useState(1);

    let [audio_loaded, setAudioLoaded] = useState(0);

    let ref_audio1 = React.useRef();
    let ref_audio2 = React.useRef();
    let ref_audio3 = React.useRef();

    function wrong() {
        ref_audio2.current.play();
    }

    function right_call() {
        ref_audio1.current.play();
        setRight(true);
        setBlocked(false);
    }

    function block_next() {
        setBlocked(true);
    }

    let advance_progress = React.useCallback(() => {
        dispatchEvent(new CustomEvent('progress_changed', {detail: progress + 1}));
        setProgress(progress + progressStep);
        setProgressStep(1);
        setRight(false);
    }, [progress, setProgress, setRight, progressStep]);

    let next = React.useCallback(() => {
        if(!blocked) {
            advance_progress();
        }
        //           dispatchEvent(new CustomEvent('next_button_clicked', {detail: progress}));
    }, [blocked, progress, advance_progress]);

    let finish = React.useCallback(() => {
        storyFinishedIndexUpdate(id);
        navigate("/"+course);
    }, [id, course, navigate]);

    useEffect(() => {
        if(!storyElement.current) return
        let parts = storyElement.current.querySelectorAll("div.part:not(.hidden)")
        let last = parts[parts.length-1];
        let spacerX = window.innerHeight/2-last?.clientHeight*0.5;

        if(!editor)
            scroll_down();
        if(spacerX !== spacer)
            setSpacer(spacerX);
    }, [editor, spacer, storyElement, progress]);

    let controls = {
        wrong: wrong,
        right: right_call,
        block_next: block_next,
        setProgressStep: setProgressStep,
        next: next,
        advance_progress: advance_progress,
    }

    let parts = [];
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
    }, [audio_loaded, advance_progress, progress]);

    if(editor) {
        React.useMemo(() => {}, [story.id])
        return (
            <div id="story" ref={storyElement} className={story.learningLanguageRTL ? "story_rtl" : ""} >
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
                if(element.audio && element.audio.url)
                    audio_urls.push(element.audio.url);
        }

        const audio_base_path = "https://carex.uber.space/stories/";
        audios = React.useMemo(() => {
            if(audio_loaded)
                return

            let count = 0;
            let audios = {};
            audio_urls = []
            for (let url of audio_urls) {
                if (audios[url] === undefined && url !== undefined) {
                    count += 1;
                    let a = new Audio();
                    function loadingFinished() {
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
            if (count === 0) {
                console.log("count 0")
                setAudioLoaded(1);
            }
            return audios;
        }, [audio_urls])
    }

    let key_event_handler = React.useCallback((e) => {
        if (e.key === "Enter")
            next();
    }, [next]);
    React.useEffect(() => {
        window.addEventListener('keypress', key_event_handler);
        return () => window.removeEventListener('keypress', key_event_handler);
    }, [key_event_handler]);

    //if(!audio_loaded)
    //    return <Spinner />

    //if(progress === -1)
    //    return <StoryTitlePage story={story}/>

    return (
        <div>
            <audio ref={ref_audio1} volume="0.5">
                <source src={'https://d35aaqx5ub95lt.cloudfront.net/sounds/37d8f0b39dcfe63872192c89653a93f6.mp3'} type="audio/mp3" />
            </audio>
            <audio ref={ref_audio2} volume="0.5">
                <source src={'https://d35aaqx5ub95lt.cloudfront.net/sounds/f0b6ab4396d5891241ef4ca73b4de13a.mp3'} type="audio/mp3" />
            </audio>
            <audio ref={ref_audio3} volume="0.5">
                <source src={'https://d35aaqx5ub95lt.cloudfront.net/sounds/2aae0ea735c8e9ed884107d6f0a09e35.mp3'} type="audio/mp3" />
            </audio>

            <StoryHeader progress={progress} length={parts.length} course={course} navigate={navigate} />
            <div id={styles.main}>
                <div id={styles.story} ref={storyElement} className={story.learningLanguageRTL ? styles.story_rtl : ""}>
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
