import React, {useState} from 'react';
import {
    setSyncFlag, setSyncFrontendEditor, setSyncFrontendStories, setSyncVoiceList
} from "./api_calls.mjs";
import {Spinner} from "ui_elements";

export function Sync() {
    let [loading, setLoading] = useState(false);
    let [output, setOutput] = useState("");

    async function SyncFlags() {
        setLoading(true);
        let text = await setSyncFlag();
        setOutput(text);
        setLoading(false);
    }
    async function SyncFrontendStories() {
        setLoading(true);
        let text = await setSyncFrontendStories();
        setOutput(text);
        setLoading(false);
    }
    async function SyncFrontendEditor() {
        setLoading(true);
        let text = await setSyncFrontendEditor();
        setOutput(text);
        setLoading(false);
    }
    async function SyncVoiceList() {
        setLoading(true);
        let text = await setSyncVoiceList();
        setOutput(text);
        setLoading(false);
    }
    if(loading)
        return <Spinner />
    return <div>
        <ul>
            <li onClick={SyncFlags}>Sync Flags</li>
            <li onClick={SyncFrontendStories}>Sync Stories Frontend</li>
            <li onClick={SyncFrontendEditor}>Sync Editor Frontend</li>
            <li onClick={SyncVoiceList}>Sync Voice List with TTS providers</li>
        </ul>
        <pre id="console">{output}</pre>
    </div>
}