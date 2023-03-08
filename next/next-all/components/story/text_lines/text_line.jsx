import React from "react";
import styles_common from "../common.module.css";
import styles from "./text_line.module.css";

import {EditorHook} from "../editor_hooks";
import HintLineContent from "./line_hints";
import EditorSSMLDisplay from "./audio_edit";
import AudioPlay from "./audio_play";
import useAudio from "./use_audio";
import {EditorContext, StoryContext} from "../story";


export default function TextLine({progress, unhide, element}) {
    const editor = React.useContext(EditorContext);
    const controls = React.useContext(StoryContext);

    let active = progress >= element.trackingProperties.line_index;
    if(progress-0.5 === element.trackingProperties.line_index)
        active = 0;

    let hidden = (!active) ? styles_common.hidden : "";

    let onClick;
    [hidden, onClick] = EditorHook(hidden, element.editor, editor);

    let [audioRange, playAudio, ref, url] = useAudio(element, progress)

    if(element.line === undefined)
        return <></>

    let hideRangesForChallenge = element.hideRangesForChallenge;
     // TODO window.view === undefined && props.progress !== element.trackingProperties.line_index)
    if(progress !== element.trackingProperties.line_index)
        hideRangesForChallenge = undefined;

    //if(props.progress !== element.trackingProperties.line_index)
    //    hideRangesForChallenge = undefined;
    // <!--                    <span className="audio_reload" id={"audio_reload"+element.line.content.audio.ssml.id} onClick={() => generate_audio_line(window.story_json, element.line.content.audio.ssml.id)}></span>-->
    if (element.line.type === "TITLE")
        return <div className={styles.title+" "+styles_common.fadeGlideIn+" "+hidden} data-lineno={element?.editor?.block_start_no}>
                    <span className={styles.title}>
                        <audio ref={ref}>
                            <source src={url} type="audio/mp3" />
                        </audio>
                        <AudioPlay onClick={playAudio} />
                        <HintLineContent audioRange={audioRange} hideRangesForChallenge={hideRangesForChallenge} content={element.line.content} />
                    </span>
        </div>;
    else if (element.line.avatarUrl)
        return <><div className={styles.phrase+" "+styles_common.fadeGlideIn+" "+hidden} onClick={onClick} data-lineno={element?.editor?.block_start_no}>
            <img className={styles.head+" "+(controls.rtl ? styles.rtl_head : "")} src={element.line.avatarUrl} alt="head"/>
            <span className={styles.bubble+" "+(controls.rtl ? styles.rtl_bubble : "")}>
                <audio ref={ref}>
                    <source src={url} type="audio/mp3" />
                </audio>
                <AudioPlay onClick={playAudio} />
                <HintLineContent audioRange={audioRange} hideRangesForChallenge={hideRangesForChallenge} unhide={unhide} content={element.line.content} />
                {(editor && (element.line.content.audio)) ?
                    <EditorSSMLDisplay ssml={element.line.content.audio.ssml} audio={element.line.content.audio} editor={editor}/>
                    : <></>
                }
            </span>

        </div>
        </>
            ;

    else
        return <div className={styles.phrase+" "+styles_common.fadeGlideIn+" "+hidden} data-lineno={element?.editor?.block_start_no}>
                <span>
                    <audio ref={ref}>
                        <source src={url} type="audio/mp3" />
                    </audio>
                    <AudioPlay onClick={playAudio} />
                    <HintLineContent audioRange={audioRange} hideRangesForChallenge={hideRangesForChallenge} unhide={unhide} content={element.line.content} />
                    {(editor && (element.line.content.audio)) ?
                        <EditorSSMLDisplay ssml={element.line.content.audio.ssml} audio={element.line.content.audio} editor={editor}/>
                        : <></>
                    }
                </span>
        </div>;
}