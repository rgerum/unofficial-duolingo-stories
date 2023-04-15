//window.editorShowTranslations = false
//window.editorShowSsml = false
import React from "react";
import styles from "./header.module.css";
import Link from "next/link";
import {DoubleFlag} from "../../../layout/flag";
import Login from "../../../login/login_dialog";
import EditorButton from "../../editor_button";

export function StoryEditorHeader({
                                      story_data,
                                      userdata,
                                      unsaved_changes,
                                      language_data,
                                      language_data2,
                                      func_save,
                                      func_delete,
                                      show_trans,
                                      set_show_trans,
                                      show_ssml,
                                      set_show_ssml,
                                  }) {
    //const [show_trans, set_show_trans] = React.useState(); // TODO window.editorShowTranslations
    function do_set_show_trans() {
        let value = !show_trans;
        const event = new CustomEvent("editorShowTranslations", {
            detail: {show: value}
        });
        window.dispatchEvent(event);
        window.editorShowTranslations = value
        set_show_trans(value);
        window.requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("resize")));
    }

    //const [show_ssml, set_show_ssml] = React.useState(); // TODO window.editorShowSsml
    function do_set_show_ssml() {
        let value = !show_ssml;
        const event = new CustomEvent("editorShowSsml", {
            detail: {show: value}
        });

        window.dispatchEvent(event);
        window.editorShowSsml = value
        set_show_ssml(value);
        window.requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("resize")));
    }

    const [save_text, set_save_text] = React.useState("Save");

    async function Save() {
        try {
            set_save_text("Saving...");
            func_save();
        } catch (e) {
            console.log("error save", e);
            window.alert("Story could not be saved.")
        }
        set_save_text("Save");
        document.querySelector("#button_save span").innerText = "Save";
    }

    async function Delete() {
        if (confirm("Are you sure that you want to delete this story?")) {
            document.querySelector("#button_delete span").innerText = "Deleting";
            try {
                func_delete();
            } catch (e) {
                console.log("error delete", e);
                document.querySelector("#button_delete span").innerText = "Delete";
                window.alert("Story could not be deleted");
            }
        }
    }

    return <>
        <div className={styles.toolbar} >
        <div className={styles.AvatarEditorHeader}>
            <EditorButton img={"back.svg"} text={"Back"} id="button_back" href={`/editor/course/${story_data?.course_id}`}
                              style={{paddingLeft: 0}} />
            <b>Story-Editor</b>
            <DoubleFlag width={40} lang1={language_data} lang2={language_data2}/>
            {language_data?.name && language_data2?.name ?
                <span
                    className={"AvatarEditorHeaderFlagname"}>{`${language_data?.name} (from ${language_data2?.name})`}</span> : null}
            {story_data?.image ?
                <img alt="story title" width="50px"
                     src={`https://stories-cdn.duolingo.com/image/${story_data?.image}.svg`}
                     style={{marginLeft: "auto"}}/>
                : <img alt="story title" width="50px" src={`/icons/empty_title.svg`} style={{marginLeft: "auto"}}/>}
            <span className={"AvatarEditorHeaderFlagname"}>{story_data?.name}</span>

            <EditorButton style={{marginLeft: "auto"}} id="button_delete" onClick={Delete} img={"delete.svg"} text={"Delete"} />
            <EditorButton onClick={do_set_show_trans} checked={show_trans ? "checked" : ""} text={"Hints"} />
            <EditorButton onClick={do_set_show_ssml} checked={show_ssml ? "checked" : ""} text={"Audio"} />

            <EditorButton id="button_save" onClick={Save} img={"save.svg"} text={save_text + (unsaved_changes ? "*" : "")} />

            <Login page={"editor"}/>
        </div>
        </div>
    </>
}