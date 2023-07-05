import styles from './layout.module.css'
import Login from "../../login/login_dialog";
import {DoubleFlag} from "../../layout/flag";
import React from "react";
import EditorButton from "../editor_button";

export default function Layout({ children, course, import_id, toggleShow }) {
    return (
    <>
    <nav className={styles.header_index}>
        <b>Course-Editor</b>
        {course ? <>
            <DoubleFlag width={40}
                        lang1={{short: course.learningLanguage, flag:course.learningLanguageFlag, flag_file:course.learningLanguageFlagFile}}
                        lang2={{short: course.fromLanguage, flag:course.fromLanguageFlag, flag_file:course.fromLanguageFlagFile}}
                        onClick={toggleShow}
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
        <Login page={"editor"} course_id={course?.short}/>
    </nav>
    <div className={styles.main_index}>
        {children}
    </div>
    </>
    )
}
