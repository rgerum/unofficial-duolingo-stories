import React, {useState} from 'react';
import {useDataFetcher2, useInput, fetch_post} from 'includes'
import {Spinner, SpinnerBlue, Flag} from 'ui_elements'
import {LoggedInButton} from 'login'
import {getAvatars, getLanguageName, getSpeakers, setAvatarSpeaker} from "./api_calls.mjs";
import "./avatar_editor.css"
import {useParams} from "react-router-dom";
import {Link} from "react-router-dom";


function Avatar(props) {
    let avatar = props.avatar;
    let [name, setName] = useState(avatar.name);
    let [speaker, setSpeaker] = useState(avatar.speaker);
    let [inputName, inputNameSetValue] = useInput(name || "");
    let [inputSpeaker, inputSpeakerSetValue] = useInput(speaker || "");

    let unsavedChanged = inputName !== (name || "") || inputSpeaker !== (speaker || "");

    let language_id = props.language_id;
    async function save() {
        let name = inputName;
        let speaker = inputSpeaker;
        let data = {
            name: name,
            speaker: speaker,
            language_id: language_id,
            avatar_id: avatar.avatar_id,
        };
        await setAvatarSpeaker(data);
        setName(name);
        setSpeaker(speaker);
    }
    if(avatar.avatar_id === -1) {
        return <div className={"avatar"}>
            <p>{avatar.avatar_id}<span>{unsavedChanged ? "*" : ""}</span></p>
            <p style={{height: "50px"}}>
                <img alt="avatar" src={avatar.link} style={{height: "50px"}}/>
            </p>

            <p>{inputName}</p>
            <p><input value={inputSpeaker} onChange={inputSpeakerSetValue} type="text" placeholder="Speaker"/></p>
            <span className="copy_button" title="play audio" onClick={(e) => props.play(e, inputSpeaker, "Duo")}><img alt="play" src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"/></span>
            <p><input className="save-btn" value="save" onClick={save} disabled={!unsavedChanged} type="button"/></p>
        </div>
    }
    return <div className={"avatar"}>
        <p>{avatar.avatar_id}<span>{unsavedChanged ? "*" : ""}</span></p>
        <p>
            <img alt="avatar" src={avatar.link} style={{height: "50px"}}/>
        </p>

        <p><input value={inputName} disabled={avatar.avatar_id === 0} onChange={inputNameSetValue} type="text" placeholder="Name"/></p>
        <p><input value={inputSpeaker} onChange={inputSpeakerSetValue} type="text" placeholder="Speaker"/></p>

        <PlayButton play={props.play} speaker={inputSpeaker} name={avatar.avatar_id === 0 ? "Duo" : inputName} />
        <p><input value="save" className="save-btn" onClick={save} disabled={!unsavedChanged} type="button"/></p>
    </div>
}

function AvatarEditorHeader(props) {
    let language_data = props.language_data;

    if(language_data === undefined)
        return <></>
    return <div className="AvatarEditorHeader">
        <Link to={"/"} id="button_back" className="editor_button" style={{paddingLeft: 0}}>
            <div><img alt="icon back" src="/icons/back.svg" /></div>
            <span>Back</span>
        </Link>
        <b>Character-Editor</b>
        <Flag iso={language_data.short} width={40} flag={language_data.flag} flag_file={language_data.flag_file}/>
        <span data-cy="language-name" className={"AvatarEditorHeaderFlagName"}>{language_data.name}</span>
        <div style={{marginLeft: "auto"}}></div>
        <LoggedInButton username={props.username} doLogout={props.doLogout} page="editor"/>
    </div>
}


export function AvatarMain(props) {
    let {language} = useParams();
    const [language_data, ] = useDataFetcher2(getLanguageName, [language]);

    return <>
        <div id="toolbar">
            <AvatarEditorHeader language={language} language_data={language_data} username={props.username} doLogout={props.doLogout}/>
        </div>
        <div id="root" className="character-editor-content">
            <AvatarNames language={language} language_data={language_data}/>
        </div>
    </>
}

function PlayButton(props) {
    let play = props.play;
    let speaker = props.speaker;
    let name = props.name;

    let [loading, setLoading] = useState(0);

    async function do_play(e, text, name) {
        e.preventDefault();
        setLoading(1);
        try {
            await play(e, text, name);
        }
        catch (e) {
            console.error(e);
            return setLoading(-1);
        }
        setLoading(0);
    }

    return <span className="play_button" title="play audio" onClick={(e) => do_play(e, speaker, name)}>
                {loading === 0 ? <img alt="play" src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"/> :
                 loading === 1 ? <SpinnerBlue /> :
                 loading ===-1 ? <img title="an error occurred" alt="error" src="/icons/error.svg"/> : <></>}
            </span>
}

function SpeakerEntry(props) {
    let speaker = props.speaker;
    let copyText = props.copyText;

    return <tr>
        <td className="speaker-entry-copy">
            <PlayButton play={props.play} speaker={speaker.speaker} name="Duo" />
            <span className="ssml_speaker">{speaker.speaker}</span>
            <span className="copy_button" title="copy to clipboard" onClick={(e) => copyText(e, speaker.speaker)}><img alt="copy" src="/icons/copy.svg"/></span>
        </td>
        <td>{speaker.gender}</td>
        <td>{speaker.type}</td>
    </tr>
}

function AvatarNames(props) {
    let language = props.language;
    let language_data = props.language_data;
    const [avatars, ] = useDataFetcher2(getAvatars, [language]);
    const [speakers, ] = useDataFetcher2(getSpeakers, [language]);

    let [speakText, setSpeakText] = useState("");
    const [stored, setStored] = useState({});

    const [pitch, setPitch] = useState(2);
    const [speed, setSpeed] = useState(2);

    function copyText(e, text) {
        let p = ["x-low", "low", "medium", "high", "x-high"][pitch];
        let s = ["x-slow", "slow", "medium", "fast", "x-fast"][speed];
        if(pitch !== 2 && speed !== 2)
            text = `${text}(pitch=${p}, rate=${s})`
        else if(pitch !== 2 && speed === 2)
            text = `${text}(pitch=${p})`
        else if(pitch === 2 && speed !== 2)
            text = `${text}(rate=${s})`

        e.preventDefault();
        return navigator.clipboard.writeText(text);
    }

    if(speakText === "")
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

    async function play2(e, text, name) {
        let speakText2 = `<prosody pitch="${["x-low", "low", "medium", "high", "x-high"][pitch]}" rate="${["x-slow", "slow", "medium", "fast", "x-fast"][speed]}">${speakText}</prosody>`;
        let id = text+pitch+speed+name;
        return play(e, id, text, name, speakText2)
    }

    async function play3(e, text, name) {
        text = text.trim();
        let match = text.match(/([^(]*)\((.*)\)/);
        let speakText2 = speakText;
        if(match) {
            text = match[1];
            let attributes = "";
            for(let part of match[2].matchAll(/(\w*)=([\w-]*)/g)) {
                attributes += ` ${part[1]}="${part[2]}"`;
            }
            speakText2 = `<prosody ${attributes}>${speakText}</prosody>`;
        }

        let id = text+pitch+speed+name;
        return play(e, id, text, name, speakText2)
    }

    async function play(e, id, text, name, speakText) {
        if(stored[id] === undefined) {
            let response2 = await fetch_post(`https://carex.uber.space/stories/audio/set_audio2.php`,
                {"id": 0, "speaker": text, "text": speakText.replace("$name", name)});
            let ssml_response = await response2.json();
            stored[id] = new Audio("https://carex.uber.space/stories/audio/" + ssml_response["output_file"]);
            setStored(stored);
        }
        let audio = stored[id];
        audio.play();


        e.preventDefault();
    }

    if(avatars === undefined || speakers === undefined || language === undefined)
        return <Spinner/>
    return <>
    <div className={"speaker_list" + (speakers?.length > 0 ? "": " no-voices")}>
        <div>
            <textarea value={speakText} onChange={doSetSpeakText} style={{width: "100%"}}/>
        </div>
        <div className="slidecontainer">
            Pitch: <input type="range" min="0" max="4" value={pitch} id="pitch" onChange={(e)=>setPitch(parseInt(e.target.value))}/>
        </div>
        <div className="slidecontainer">
            Speed: <input type="range" min="0" max="4" value={speed} id="speed" onChange={(e)=>setSpeed(parseInt(e.target.value))}/>
        </div>
        <table id="story_list" data-cy="voice_list" className="voice_list js-sort-table js-sort-5 js-sort-desc" data-js-sort-table="true">
            <thead>
            <tr>
                <th style={{borderRadius: "10px 0 0 0"}} data-js-sort-colnum="0">Name</th>
                <th data-js-sort-colnum="1">Gender</th>
                <th style={{borderRadius: "0 10px 0 0"}} data-js-sort-colnum="2">Type</th>
            </tr>
            </thead>
            <tbody>
            {speakers.map((speaker, index) =>
                <SpeakerEntry key={index} copyText={copyText} speaker={speaker} play={play2} />
            )}
            </tbody>
        </table>
    </div>
    <div className={"avatar_editor" + (speakers?.length > 0? "": " no-voices")} style={{"overflowY": "scroll"}}>
        <p>These characters are the default cast of duolingo. Their names should be kept as close to the original as possible.</p>
        <div className={"avatar_editor_group"} data-cy="avatar_list1">
        {avatars_new_important.map((avatar, index) =>
            <Avatar key={index} play={play3} language_id={language} avatar={avatar} />
        )}
        </div>
        <p>These characters just appear in a couple of stories.</p>
        <div className={"avatar_editor_group"} data-cy="avatar_list2">
        {avatars_new.map((avatar, index) =>
            <Avatar key={index} play={play3} language_id={language} avatar={avatar} />
        )}
        </div>
    </div>
    </>
}

