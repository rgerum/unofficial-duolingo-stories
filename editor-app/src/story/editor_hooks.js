import React from "react";
import {EditorSelection} from "@codemirror/state";
import {useEventListener} from "./includes";

export function EditorHook(hidden, editor) {
    let onClick;
    if(editor) {
        hidden = "";
        onClick = () => {
            let pos = view.state.doc.line(parseInt(editor.start_no)).from;
            if(editor.active_no)
                pos = view.state.doc.line(parseInt(editor.active_no)).from;
            view.dispatch(view.state.update({
                selection: EditorSelection.cursor(pos),
                //scrollIntoView: true,
            }));
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

export function EditorNoHook(hidden, editor, selected) {
    let onClick;
    if(editor) {
        hidden = "";
        onClick = () => {
            let pos = view.state.doc.line(parseInt(editor.start_no)).from;
            if(editor.active_no)
                pos = view.state.doc.line(parseInt(editor.active_no)).from;
            view.dispatch(view.state.update({
                selection: EditorSelection.cursor(pos),
                scrollIntoView: true,
            }));
        }
    }

    if(selected)
        hidden = "story_selection";

    return [hidden, onClick];
}