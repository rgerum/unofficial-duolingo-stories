import React from 'react';
import {useDataFetcher, useDataFetcher2, useEventListener} from './hooks'
import {Spinner} from './react/spinner'
import {Flag} from './react/flag'
import {useUsername, Login, LoginDialog} from './login'
import {useInput} from "./hooks";
import {getAvatars, setPublic, getCourses, getCourse, getImportList, setImport, getSession} from "./api_calls.mjs";
import "./avatar_editor.css"

function Avatar(props) {
    let avatar = props.avatar;
    let [inputName, inputNameSetValue] = useInput(avatar.name);
    let [inputSpeaker, inputSpeakerSetValue] = useInput(avatar.speaker);
    return <div className={"avatar"}>
        <p>{avatar.id}</p>
        <p>
            <img src={avatar.link} style={{width: "40px"}}/>
        </p>

        <p><input value={inputName} onChange={inputNameSetValue} type="text" placeholder="Name"/></p>
        <p><input value={inputSpeaker} onChange={inputSpeakerSetValue} type="text" placeholder="Speaker"/></p>
        <p><input value="save" disabled={(inputName === avatar.name && inputSpeaker === avatar.speaker) ? true : false} type="button"/></p>
    </div>
}

export function AvatarNames(props) {
    let urlParams = new URLSearchParams(window.location.search);
    const [language, setLanguage] = React.useState(urlParams.get("language") || undefined);
    const [avatars, _] = useDataFetcher2(getAvatars, [language]);

    console.log(avatars)
    let images = [];
    let avatars_new = [];
    let avatars_new_important = [];
    if(avatars !== undefined)
    for(let avatar of avatars) {
        console.log(avatar, images.indexOf(avatar.link))
        if(images.indexOf(avatar.link) === -1) {
            if([414, 415, 416, 418, 507, 508, 509, 592, 593].indexOf(avatar.id) !== -1)
                avatars_new_important.push(avatar);
            else
                avatars_new.push(avatar);
            images.push(avatar.link)
        }
    }


    if(avatars === undefined)
        return <Spinner/>
    return <div className={"avatar_editor"}>
        {avatars_new_important.map((avatar, index) =>
            <Avatar key={index} avatar={avatar} />
        )}
        {avatars_new.map((avatar, index) =>
            <Avatar key={index} avatar={avatar} />
        )}
    </div>
}

