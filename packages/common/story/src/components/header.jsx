import React from "react";
import {EditorHook} from "./editor_hooks";
import {HintLineContent} from "./line_hints";
import {EditorSSMLDisplay} from "./audio_edit";
import {useEventListener} from "./includes";


export function Header(props) {
    let element = props.element;
    let hidden = (props.progress < element.trackingProperties.line_index) ? "hidden": ""

    if(props.hidden)
        hidden = "hidden";

    let onClick;
    [hidden, onClick] = EditorHook(hidden, props.element.editor, props.editor);

    let [audioRange, playAudio] = useAudio(element, props.audios)

    let hideRangesForChallenge = undefined;

    return <div className={"title fadeGlideIn "+hidden} style={{textAlign: "center"}} onClick={onClick} lineno={element?.editor?.block_start_no}>
        <div><img alt="title image" className="title_img" src={element.illustrationUrl} /></div>
        <h1 className="title">
            <AudioPlay onClick={playAudio} />
            <HintLineContent audioRange={audioRange} hideRangesForChallenge={hideRangesForChallenge} content={element.learningLanguageTitleContent} />
            {(props.editor && (element.audio)) ?
                <EditorSSMLDisplay ssml={element.audio.ssml} audio={element.audio} editor={props.editor}/>
                : <></>
            }
                </h1>
    </div>;
}


export function TextLine(props) {
    let element = props.element;
    let hidden = (props.progress < element.trackingProperties.line_index) ? "hidden": ""

    if(props.hidden)
        hidden = "hidden";

    let onClick;
    [hidden, onClick] = EditorHook(hidden, props.element.editor, props.editor);

    let [audioRange, playAudio] = useAudio(element, props.audios)

    if(element.line === undefined)
        return <></>

    let hideRangesForChallenge = element.hideRangesForChallenge;
    if(window.view === undefined && props.progress !== element.trackingProperties.line_index)
        hideRangesForChallenge = undefined;

    //if(props.progress !== element.trackingProperties.line_index)
    //    hideRangesForChallenge = undefined;
    // <!--                    <span className="audio_reload" id={"audio_reload"+element.line.content.audio.ssml.id} onClick={() => generate_audio_line(window.story_json, element.line.content.audio.ssml.id)}></span>-->
    if (element.line.type === "TITLE")
        return <div className={"title fadeGlideIn "+hidden} lineno={element?.editor?.block_start_no}>
                    <span className="title">
                        <AudioPlay onClick={playAudio} />
                        <HintLineContent audioRange={audioRange} hideRangesForChallenge={hideRangesForChallenge} content={element.line.content} />
                    </span>
        </div>;
    else if (element.line.avatarUrl)
        return <><div className={"phrase fadeGlideIn "+hidden} onClick={onClick} lineno={element?.editor?.block_start_no}>
            <img className="head" src={element.line.avatarUrl} alt="head"/>
            <span className="bubble">
                        <AudioPlay onClick={playAudio} />
                        <HintLineContent audioRange={audioRange} hideRangesForChallenge={hideRangesForChallenge} unhide={props.unhide} content={element.line.content} />
                {(props.editor && (element.line.content.audio)) ?
                    <EditorSSMLDisplay ssml={element.line.content.audio.ssml} audio={element.line.content.audio} editor={props.editor}/>
                    : <></>
                }
            </span>

        </div>
        </>
            ;

    else
        return <div className={"phrase fadeGlideIn "+hidden} lineno={element?.editor?.block_start_no}>
                <span>
                    <AudioPlay onClick={playAudio} />
                    <HintLineContent audioRange={audioRange} hideRangesForChallenge={hideRangesForChallenge} unhide={props.unhide} content={element.line.content} />
                    {(props.editor && (element.line.content.audio)) ?
                        <EditorSSMLDisplay ssml={element.line.content.audio.ssml} audio={element.line.content.audio} editor={props.editor}/>
                        : <></>
                    }
                </span>
        </div>;
}


window.playing_audio = [];
var audio_base_path = "https://carex.uber.space/stories/";
function useAudio(element, audios) {
    let [audioRange, setAudioRange] = React.useState(99999);
    let audio = element?.line?.content?.audio;

    if(audio === undefined)
        audio = element?.learningLanguageTitleContent?.audio;

    useEventListener("progress_changed", e => {
        if(audio === undefined)
            return
        if(e.detail === (element.trackingProperties.line_index || 0)) {
            if(audio && audio.url)
                playAudio();
        }
    })

    if(audio === undefined || audio.url === undefined) {
        React.useMemo(()=>{}, [undefined]);
        return [10000000, undefined]
    }

    let audioObject = React.useMemo(() => {
        if(audios && audios[audio.url])
            return audios[audio.url];
        return new Audio(audio_base_path + audio.url);
    }, [audio_base_path + audio.url]);

    function playAudio() {
        for(let audio_cancel of window.playing_audio)
            audio_cancel();
        window.playing_audio = [];
        audioObject.pause();
        audioObject.currentTime = 0;
        audioObject.play();
        let timeouts = [];
        let last_end = 0;
        for(let keypoint of audio.keypoints) {
            last_end = keypoint.rangeEnd;
            let t = setTimeout(() => {
                setAudioRange(keypoint.rangeEnd);
            }, keypoint.audioStart);
            timeouts.push(t);
        }
        function cancel() {
            for(let t in timeouts)
                clearTimeout(t);
            setAudioRange(last_end);
            audioObject.pause();
        }
        window.playing_audio.push(cancel);
    }

    return [audioRange, playAudio];
}

function AudioPlay(props) {
    if(props.onClick === undefined)
        return <></>
    return <img onClick={props.onClick} src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"
                className="loudspeaker" alt="speaker" />;
}