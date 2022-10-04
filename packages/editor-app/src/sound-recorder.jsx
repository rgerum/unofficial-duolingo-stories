import React, {useEffect, useState} from 'react';
import './sound-recorder.css';
import {fetch_post, setUploadAudio, upload_audio_endpoint} from "./api_calls.mjs";

window.open_recoder = function () {}

let mediaRecorder = undefined;
let chunks = [];
var audio_base_path = "https://editor.duostories.org/stories/";
export function SoundRecorder() {
    const [ssml, setSSML] = useState(undefined);
    const [ready, setReady] = useState(false);
    const [normalizeData, setnormalizeData] = useState([]);
    const [timings, setTimings] = useState([]);
    const [audio_line, setAudioLine] = useState("");
    const [audio_filename, setAudioFilename] = useState("");
    const [duration, setDuration] = useState(0.1);
    const [playProgress, setPlayProgress] = useState(0);

    window.open_recoder = function (props) {
        setSSML(props.ssml);
        let new_timings = [];
        let last_audiostart= 0;
        let last_rangeend = 0;
        for(let part of props.audio.keypoints) {
            new_timings.push((part.audioStart + last_audiostart)/1000);
            last_audiostart += part.audioStart;
        }
        setTimings(new_timings);
        setAudioFilename(props.audio.url.split("/").pop());
        setAudioURL(audio_base_path + props.audio.url);
    }

    function updateAudioLine() {
        let time_offset = 0;
        let filename = audio_filename
        let audio_line = "$"+ssml.id+"/"+filename;
        for(let i in parts) {
            let t = parseInt((timings[i] - time_offset)*1000);
            time_offset += t/1000
            audio_line += ";";
            audio_line += parts[i].length - ((i==="0") ? 1 : 0);
            audio_line += ",";
            audio_line += t;
        }
        setAudioLine(audio_line);
    }

    function setAudioURL(audioURL) {

        function visualize(audioBuffer) {
            window.audioBuffer = audioBuffer;

            const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
            // Number of samples we want to have in our final data set
            const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
            const filteredData = [];
            for (let i = 0; i < samples; i++) {
                let blockStart = blockSize * i; // the location of the first sample in the block
                let sum = 0;
                for (let j = 0; j < blockSize; j++) {
                    sum = sum + Math.abs(rawData[blockStart + j]) // find the sum of all the samples in the block
                }
                filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
            }
            const multiplier = Math.pow(Math.max(...filteredData), -1);
            const normalizeData = filteredData.map(n => n * multiplier);
            window.normalizeData = normalizeData;
            setnormalizeData(normalizeData);

            let chars = text.length;
            let pos = 0;
            let timings = [];
            for(var t of parts) {
                timings.push(pos);
                pos += t.length/chars*audio.duration;
            }
            setTimings(timings);
            updateAudioLine()
            setDuration(audio.duration);
            setPlayProgress(duration);

        }

        const audioContext = new AudioContext();
        window.audioContext= audioContext
        let x = fetch(audioURL,{method: "GET", mode: "cors"})
            .then(response => { return response.arrayBuffer()})
            .then(arrayBuffer => { return audioContext.decodeAudioData(arrayBuffer)})
            .then(audioBuffer => { return visualize(audioBuffer)});

        const audio = document.getElementById('audio_record');
        audio.setAttribute('controls', '');
        audio.controls = false;
        audio.src = audioURL;
    }

    function chunks_updated() {
        const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
        curret_blob = blob;
        window.chunks = chunks;
        window.curret_blob = curret_blob;
        window.blob = blob;

        const audioURL = window.URL.createObjectURL(blob);
        setAudioURL(audioURL);
    }

    let curret_blob = undefined;
    useEffect(()=>{
        function onSuccess(stream) {

            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.onstop = function(e) {
                let filename = window.audio_insert_lines[ssml.inser_index][1]+".ogg";
                setAudioFilename(filename)

                chunks_updated();
                chunks = [];
            }

            mediaRecorder.ondataavailable = function(e) {
                chunks.push(e.data);
            }

            setReady(true);
        }
        function onError() {

        }
        navigator.mediaDevices.getUserMedia({audio: true}).then(onSuccess, onError);
    })

    async function save() {
        let result = await setUploadAudio(ssml.id, window.curret_blob, audio_filename);

        let [line, line_insert] = window.audio_insert_lines[ssml.inser_index];
        if(line !== undefined) {
            let line_state = view.state.doc.line(line)
            view.dispatch(view.state.update({
                changes: {
                    from: line_state.from,
                    to: line_state.to,
                    insert: audio_line
                }
            }))
        }
        else {
            let line_state = view.state.doc.line(line_insert-1)
            view.dispatch(view.state.update({
                changes: {
                    from: line_state.from,
                    to: line_state.from,
                    insert: audio_line+"\n"
                }
            }))
        }
        return result;
    }

    function start() {
        mediaRecorder.start();
    }
    function stop() {
        mediaRecorder.stop();
    }
    function play() {
        const audio = document.getElementById('audio_record');
        audio.play();
        let playProgress = 0;
        function advance() {
            playProgress = audio.currentTime
            if(playProgress < duration) {
                setPlayProgress(playProgress);
                window.setTimeout(advance, 100)
            }
            else {
                setPlayProgress(duration);
            }
        }
        setPlayProgress(0);
        window.setTimeout(advance, 100)
    }
    let text = ssml?.plan_text || "";
    let parts = [];
    let punctuation_chars = "\\\/¡!\"\'\`#$%&*,.:;<=>¿?@^_`{|}…"+
        "。、，！？；：（）～—·《…》〈…〉﹏……——"
    let regex_split_token = new RegExp(`([\\s${punctuation_chars}\\]]*(?:^|\\s|$|​)[\\s${punctuation_chars}]*)`);
    let elements = text.split(regex_split_token);
    elements.pop();
    if(elements[0] === "") {
        parts.push(elements.shift()+elements.shift()+elements.shift()+elements.shift())
    }
    while(elements.length) {
        parts.push(elements.shift() + elements.shift());

    }

    let samples = 100;
    let width = 500;
    let time_to_x = (t) => t/duration*(width-10)+5
    let x_to_time = (x) => (x-5)*duration/(width-10)
    let sample_to_x = (i) => i/samples*(width-10)+5
    let sample_to_t = (i) => i/samples*duration;


    /* resize */
    var startX = 0, startWidth = 0, startWidth2, move_index;

    function initDrag(i) {
        function initDrag2(e) {
            move_index = i;
            console.log("initDrag", i, e);
            startX = e.clientX;
            startWidth = timings[move_index];
            document.documentElement.addEventListener('mousemove', doDrag, false);
            document.documentElement.addEventListener('mouseup', stopDrag, false);
        }
        console.log("initDrag", i, initDrag2);
        return initDrag2;
    }

    function doDrag(e) {
        let x = e.clientX - startX
        timings[move_index] = startWidth + x_to_time(x);
        setTimings(timings);
        updateAudioLine()
        console.log(x, startWidth, x_to_time(x), timings);
        //editor.style.width = (startWidth + e.clientX - startX) + 'px';
        //preview.style.width = (startWidth2 - e.clientX + startX) + 'px';
        //window.dispatchEvent(new CustomEvent("resize"));
        document.getElementById("audio_timings_"+move_index).setAttribute("transform", `translate(${time_to_x(timings[move_index])}, 0)`)

    }

    function stopDrag() {
        document.documentElement.removeEventListener('mousemove', doDrag, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
    }

    if(ssml === undefined) return <></>

    return <div id="sound_recorder">
        <button className="button" onClick={play}  data-cy="submit">▶️</button>
        <button className="button" onClick={start}  data-cy="submit">🔴</button>
        <button className="button" onClick={stop}  data-cy="submit">⬛</button>
        &nbsp;
        <button className="button" onClick={save}  data-cy="submit">💾</button>
        <a id="quit" onClick={()=>setSSML(undefined)}></a>
        <span className="sound_target">{ssml.plan_text}</span>
        <br/>
        <audio id="audio_record"></audio>
        {!ready ? <div>waiting</div> : <>

            <svg width={width+"px"}  viewBox={"0 -40 "+width+" 50"}>
            {normalizeData.map((d, i) => (
                <line key={i} x1={sample_to_x(i)} x2={sample_to_x(i)} y1={d*10} y2={-d*10} stroke={(sample_to_t(i) > playProgress) ? "red": "var(--link-blue)"} strokeLinecap="round"/>
            ))}
            {timings.map((p, i) => (
                <g id={"audio_timings_"+i} transform={`translate(${time_to_x(timings[i])}, 0)`} key={i} className={(timings[i] > playProgress) ? "audio_inactive": "audio_active"} onMouseDown={initDrag(i)}>
                    <line x1={0} x2={0} y1={10} y2={-10-5} strokeLinecap="round" />
                    <text x={0} y="-25">{parts[i]}</text>
                    <circle cx={0} cy={-10-5} r={8} />
                </g>
            ))}</svg>
        </>}
        <span>{audio_filename}</span>
        <span>{audio_line}</span>
        <span>{timings}</span>
    </div>
}
