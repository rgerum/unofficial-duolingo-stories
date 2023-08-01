'use client'
import styles from "./layout.module.css";
import React from "react";
import {useSelectedLayoutSegments} from "next/navigation";
import {DoubleFlag} from "components/layout/flag";
import EditorButton from "../editor_button";


export default function LayoutFlag({courses}) {
    const segment = useSelectedLayoutSegments();
    let import_id = segment[4];
    let course = undefined;

    for(let c of courses) {
        if(c.short === segment[1]) {
            course = c;
            break;
        }
    }
    function toggleShow() {
        console.log("event")
        const event = new Event("toggleSidebar");
        window.dispatchEvent(event);
    }
// onClick={toggleShow}
    return <>{course ? <>
            <DoubleFlag width={40} onClick={toggleShow}
                        lang1={{short: course.learningLanguage, flag:course.learningLanguageFlag, flag_file:course.learningLanguageFlagFile}}
                        lang2={{short: course.fromLanguage, flag:course.fromLanguageFlag, flag_file:course.fromLanguageFlagFile}}

            />
            <span className={styles.AvatarEditorHeaderFlagname} data-cy="course-title">{`${course.learningLanguageName} (from ${course.fromLanguageName})`}</span>
        </> : <></>
    }
        <div style={{marginLeft: "auto"}}></div>
        {course ? <>{course.official ? <span className={styles.official} data-cy="label_official"><i>official</i></span> :
            !import_id ?
                <EditorButton id="button_import" href={`/editor/course/${course.short}/import/es-en`}
                              data-cy="button_import" img={"import.svg"} text={"Import"} /> :
                <EditorButton id="button_back" href={`/editor/course/${course.short}`}
                              data-cy="button_back" img={"back.svg"} text={"Back"}/>
        }</> : ""}
        <div className={styles.spacer}></div>
    </>
}