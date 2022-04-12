import React, {useState} from 'react';
import {useDataFetcher, useDataFetcher2, useEventListener} from './hooks'
import {Spinner} from './react/spinner'
import {Flag} from './react/flag'
import {useUsername, Login, LoginDialog} from './login'
import {useInput} from "./hooks";
import {getAvatars, getLanguageName, getSpeakers, setAvatarSpeaker} from "./api_calls.mjs";
import "./avatar_editor.css"
import {fetch_post} from "./includes.mjs";
import {CourseEditorHeader} from "./editor";

function Avatar(props) {
    let avatar = props.avatar;
    let [inputName, inputNameSetValue] = useInput(avatar.name || "");
    let [inputSpeaker, inputSpeakerSetValue] = useInput(avatar.speaker || "");
    let language_id = props.language_id;
    function save() {
        let data = {
            name: inputName,
            speaker: inputSpeaker,
            language_id: language_id,
            avatar_id: avatar.avatar_id,
        };
        setAvatarSpeaker(data)
    }
    if(avatar.avatar_id === 0) {
        return <div className={"avatar"}>
            <p>{avatar.avatar_id}</p>
            <p style={{height: "50px"}}>
                <img src={avatar.link} style={{height: "50px"}}/>
            </p>

            <p>{inputName}</p>
            <p><input value={inputSpeaker} onChange={inputSpeakerSetValue} type="text" placeholder="Speaker"/></p>
            <span className="copy_button" title="play audio" onClick={(e) => props.play(e, inputSpeaker, "Duo")}><img src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"/></span>
            <p><input value="save" onClick={save} disabled={(inputName && inputName === avatar.name && inputSpeaker && inputSpeaker === avatar.speaker) ? true : false} type="button"/></p>
        </div>
    }
    return <div className={"avatar"}>
        <p>{avatar.avatar_id}</p>
        <p>
            <img src={avatar.link} style={{height: "50px"}}/>
        </p>

        <p><input value={inputName} onChange={inputNameSetValue} type="text" placeholder="Name"/></p>
        <p><input value={inputSpeaker} onChange={inputSpeakerSetValue} type="text" placeholder="Speaker"/></p>
        <span className="copy_button" title="play audio" onClick={(e) => props.play(e, inputSpeaker, inputName)}><img src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"/></span>
        <p><input value="save" onClick={save} disabled={(inputName && inputName === avatar.name && inputSpeaker && inputSpeaker === avatar.speaker) ? true : false} type="button"/></p>
    </div>
}

function AvatarEditorHeader(props) {
    let urlParams = new URLSearchParams(window.location.search);
    const [language, setLanguage] = React.useState(parseInt(urlParams.get("language")) || undefined);
    const [language_data, _] = useDataFetcher2(getLanguageName, [language]);

    if(language_data === undefined)
        return <></>
    return <div className="AvatarEditorHeader">
        <b>Character-Editor</b>
        <Flag flag={language_data.flag} flag_file={language_data.flag_file}/>
        <span className={"AvatarEditorHeaderFlagname"}>{language_data.name}</span>
    </div>
}

export function AvatarMain(props) {
    return <>
        <div id="toolbar">
            <AvatarEditorHeader />
        </div>
        <div id="root">
            <AvatarNames />
        </div>
    </>
}

function AvatarNames(props) {
    let urlParams = new URLSearchParams(window.location.search);
    const [language, setLanguage] = React.useState(parseInt(urlParams.get("language")) || undefined);
    const [avatars, _] = useDataFetcher2(getAvatars, [language]);
    const [speakers, __] = useDataFetcher2(getSpeakers, [language]);
    const [language_data, ___] = useDataFetcher2(getLanguageName, [language]);
    let [speakText, setSpeakText] = useState(undefined);
    const [stored, setStored] = useState({});

    if(speakText === undefined)
        speakText = language_data?.default_text || "My name is $name.";

    function doSetSpeakText(event) {
        setStored({})
        setSpeakText(event.target.value);
    }

    let images = [];
    let avatars_new = [];
    let avatars_new_important = [];
    if(avatars !== undefined)
    for(let avatar of avatars) {
        if(images.indexOf(avatar.link) === -1) {
            if([0, 414, 415, 416, 418, 507, 508, 509, 592, 593].indexOf(avatar.avatar_id) !== -1)
                avatars_new_important.push(avatar);
            else
                avatars_new.push(avatar);
            images.push(avatar.link)
        }
    }
    function copyText(e, text) {
        navigator.clipboard.writeText(text);
        e.preventDefault();
    }
    async function play(e, text, name) {
        if(stored[text] === undefined) {
            console.log("play", text, speakText)
            //navigator.clipboard.writeText(text);
            //generate_audio_line({"id": 0, "speaker": text, "text": speakText})
            let response2 = await fetch_post(`https://carex.uber.space/stories/audio/set_audio2.php`,
                {"id": 0, "speaker": text, "text": speakText.replace("$name", name)});
            let ssml_response = await response2.json();
            console.log("ssml_response", ssml_response)
            let audio = new Audio("https://carex.uber.space/stories/audio/" + ssml_response["output_file"]);
            stored[text] = audio;
            setStored(stored);
        }
        else
            console.log("stored");
        let audio = stored[text];
        audio.play();


        e.preventDefault();
    }

    if(avatars === undefined || speakers === undefined || language === undefined)
        return <Spinner/>
    return <>
    <div className="speaker_list">
        <div>
            <textarea value={speakText} onChange={doSetSpeakText} style={{width: "100%"}}/>
        </div>
        <table id="story_list" className="js-sort-table js-sort-5 js-sort-desc" data-js-sort-table="true">
            <thead>
            <tr>
                <th style={{borderRadius: "10px 0 0 0"}} data-js-sort-colnum="0">Name</th>
                <th data-js-sort-colnum="1">Gender</th>
                <th style={{borderRadius: "0 10px 0 0"}} data-js-sort-colnum="2">Type</th>
            </tr>
            </thead>
            <tbody>
        {speakers.map((speaker, index) =>
            <tr key={index} >
                <td>
                    <span className="copy_button" title="play audio" onClick={(e) => play(e, speaker.speaker, "Duo")}><img src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"/></span>
                    <span className="ssml_speaker">{speaker.speaker}</span>
                    <span className="copy_button" title="copy to clipboard" onClick={(e) => copyText(e, speaker.speaker)}><img src="icons/copy.svg"/></span>
                </td>
                <td>{speaker.gender}</td>
                <td>{speaker.type}</td>
            </tr>
        )}
            </tbody>
        </table>
    </div>
    <div className={"avatar_editor"} style={{"overflowY": "scroll"}}>
        <p>These characters are the default cast of duolingo. Their names should be kept as close to the original as possible.</p>
        <div>
        {avatars_new_important.map((avatar, index) =>
            <Avatar key={index} play={play} language_id={language} avatar={avatar} />
        )}
        </div>
        <p>These characters just appear in a couple of stories.</p>
        <div>
        {avatars_new.map((avatar, index) =>
            <Avatar key={index} play={play} language_id={language} avatar={avatar} />
        )}
        </div>
    </div>
    </>
}

