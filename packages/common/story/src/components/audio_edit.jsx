import React from "react";
import {useEventListener, fetch_post} from "./includes";
import "./audio_edit.css"


export function EditorSSMLDisplay(props) {
    let urlParams = new URLSearchParams(window.location.search);

    let [loading, setLoading] = React.useState(false);
    let line_id = "ssml"+(props.ssml.line ? props.ssml.line : props.ssml.line_insert);

    var [show_audio, set_show_audio] = React.useState(window.editorShowSsml);
    useEventListener("editorShowSsml", (e) => set_show_audio(e.detail.show))


    async function reload() {
        setLoading(true);
        await generate_audio_line(props.ssml, props.editor.view);
        setLoading(false);
    }
    if(!show_audio) return <></>
    return <><br/>
        <span className="ssml_speaker">{props.ssml.speaker}</span>
        <span className="ssml">{props.ssml.text}</span>
        { props.ssml.speaker ?
            <span title={loading ? "generating audio..." : "regenerate audio"} id={line_id} className={"ssml_reload audio_reload " + (loading ? "audio_reload_spin" : "")}
                  onClick={reload}/> :
            <span><img title="no speaker defined" alt="error" src="/icons/error.svg"/></span>
        }
        {urlParams.get("beta") ? <a onClick={() => window.open_recoder(props)}>🎤</a> : <></>}
    </>
}


async function generate_audio_line(ssml, view) {
    let speaker = ssml["speaker"].trim();
    let speak_text = ssml["text"].trim();
    let match = speaker.match(/([^(]*)\((.*)\)/);

    if(match) {
        speaker = match[1];
        let attributes = "";
        for(let part of match[2].matchAll(/(\w*)=([\w-]*)/g)) {
            attributes += ` ${part[1]}="${part[2]}"`;
        }
        if(speak_text.startsWith("<speak>"))
            speak_text = speak_text.substring("<speak>".length)
        if(speak_text.endsWith("</speak>"))
            speak_text = speak_text.substring(0, speak_text.length-"</speak>".length)
        speak_text = `<speak><prosody ${attributes}>${speak_text}</prosody></speak>`;
    }

    let response2 = await fetch_post(`https://carex.uber.space/stories/audio/set_audio2.php`, {"id": ssml["id"], "speaker": speaker, "text": speak_text});
    let ssml_response = await response2.json();

    let text = "$"+ssml_response["output_file"]
    if(ssml_response.marks2) {
        let last_time = 0;
        let last_time_delta = 0;
        let last_end = 0;
        for (let mark of ssml_response.marks2) {
            text += ";";
            text += parseInt(mark.markName) - last_end;
            text += ",";
            text += last_time_delta;
            last_end = parseInt(mark.markName);
            last_time_delta = parseInt(mark.timeSeconds*1000) - last_time;
            last_time = parseInt(mark.timeSeconds*1000);
        }
    }
    else {
        let last_time = 0;
        let last_end = 0;
        for (let mark of ssml_response.marks) {
            text += ";";
            text += parseInt(mark.value.length) + parseInt(last_end);
            text += ",";
            text += parseInt(mark.time) - last_time;
            last_end = 1;
            last_time = parseInt(mark.time);
        }
    }
    let [line, line_insert] = window.audio_insert_lines[ssml.inser_index];
    if(line !== undefined) {
        let line_state = view.state.doc.line(line)
        view.dispatch(view.state.update({
            changes: {
                from: line_state.from,
                to: line_state.to,
                insert: text
            }
        }))
    }
    else {
        let line_state = view.state.doc.line(line_insert-1)
        view.dispatch(view.state.update({
            changes: {
                from: line_state.from,
                to: line_state.from,
                insert: text+"\n"
            }
        }))
    }
}
