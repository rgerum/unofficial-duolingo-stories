import React from "react";
import {useEventListener} from "./includes";


export function EditorHook(hidden, editor, editor_props) {
    let onClick;
    let view = editor_props?.view;

    if(editor_props) {
        hidden = "";
    }

    if(editor && view) {
        onClick = () => {
            if(editor.active_no)
                editor_props.select(editor.active_no);
            else
                editor_props.select(editor.start_no);
        }
    }

    let [selected, setSelected] = React.useState(false);
    if(selected)
        hidden = "story_selection";
    useEventListener("editorLineChanged", (e) =>
    {
        let should_be_selected = editor && editor.start_no <= e.detail.lineno && e.detail.lineno < editor.end_no;
        if (should_be_selected !== selected)
            setSelected(should_be_selected);
    })
    return [hidden, onClick];
}

export function EditorNoHook(hidden, editor, editor_props, selected) {
    let onClick;
    let view = editor_props?.view;

    if(editor_props) {
        hidden = "";
    }

    if(editor && view) {
        hidden = "";
        onClick = () => {
            if(editor.active_no)
                editor_props.select(editor.active_no,true);
            else
                editor_props.select(editor.start_no,true);
        }
    }

    if(selected)
        hidden = "story_selection";

    return [hidden, onClick];
}