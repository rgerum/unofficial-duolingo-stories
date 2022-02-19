import "./audio_edit.css"

export function EditorSSMLDisplay(props) {
    let [loading, setLoading] = React.useState(false);
    let line_id = "ssml"+(props.ssml.line ? props.ssml.line : props.ssml.line_insert);

    async function reload() {
        setLoading(true);
        await generate_audio_line(props.ssml);
        setLoading(false);
    }
    return <><br/>
        <span className="ssml_speaker">{props.ssml.speaker}</span>
        <span className="ssml">{props.ssml.text}</span>
        <span id={line_id} className={"ssml_reload audio_reload " + (loading ? "audio_reload_spin" : "")} onClick={reload}/>
    </>
}

import {fetch_post} from "./includes.mjs";
import React from "react";
async function generate_audio_line(ssml) {
    let response2 = await fetch_post(`https://carex.uber.space/stories/audio/set_audio2.php`, {"id": ssml["id"], "speaker": ssml["speaker"], "text": ssml["text"]});
    let ssml_response = await response2.json();

    let text = "$"+ssml_response["output_file"]
    let last_time = 0;
    let last_end = 0;
    for(let mark of ssml_response.marks) {
        text += ";";
        text += mark.value.length + last_end;
        text += ",";
        text += mark.time-last_time;
        last_end = 1;
        last_time = mark.time
    }
    if(ssml.line !== undefined) {
        let line_state = view.state.doc.line(ssml.line)
        view.dispatch(view.state.update({
            changes: {
                from: line_state.from,
                to: line_state.to,
                insert: text
            }
        }))
    }
    else {
        let line_state = view.state.doc.line(ssml.line_insert-1)
        view.dispatch(view.state.update({
            changes: {
                from: line_state.from,
                to: line_state.from,
                insert: text+"\n"
            }
        }))
    }
}
