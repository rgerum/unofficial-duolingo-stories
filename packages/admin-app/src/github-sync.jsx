import React, {useState} from 'react';
import {
    setSyncFlag, setSyncFrontendEditor, setSyncFrontendStories
} from "./api_calls.mjs";
import {Spinner} from "./react/spinner";

export function Sync(props) {
    let [loading, setLoading] = useState();
    let [output, setOutput] = useState();

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
    if(loading)
        return <Spinner />
    return <div>
        <ul>
            <li onClick={SyncFlags}>Sync Flags</li>
            <li onClick={SyncFrontendStories}>Sync Stories Frontend</li>
            <li onClick={SyncFrontendEditor}>Sync Editor Frontend</li>
        </ul>
        <pre id="console">{output}</pre>
    </div>
}